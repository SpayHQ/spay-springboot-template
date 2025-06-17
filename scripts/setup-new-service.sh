#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Spay Spring Boot Service Template Setup${NC}"
echo "This script will customize the template for your new service."
echo ""

# Function to validate service name
validate_service_name() {
    if [[ ! $1 =~ ^[a-z][a-z0-9-]*[a-z0-9]$ ]]; then
        echo -e "${RED}❌ Service name must be lowercase, start with a letter, and contain only letters, numbers, and hyphens${NC}"
        return 1
    fi
    return 0
}

# Function to validate package name
validate_package_name() {
    if [[ ! $1 =~ ^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)*$ ]]; then
        echo -e "${RED}❌ Package name must be valid Java package format (e.g., com.spaybusiness.payment.service)${NC}"
        return 1
    fi
    return 0
}

# Get service name
while true; do
    read -p "Enter service name (e.g., payment-service): " SERVICE_NAME
    if validate_service_name "$SERVICE_NAME"; then
        break
    fi
done

# Get package name
echo ""
echo -e "${YELLOW}💡 Suggested package: com.spaybusiness.${SERVICE_NAME//-/.}.service${NC}"
while true; do
    read -p "Enter package name: " PACKAGE_NAME
    if validate_package_name "$PACKAGE_NAME"; then
        break
    fi
done

# Get service class name (capitalize and remove hyphens)
SERVICE_CLASS=$(echo "$SERVICE_NAME" | sed 's/-//g' | sed 's/\b\w/\u&/g')
echo ""
echo -e "${YELLOW}💡 Service class will be: ${SERVICE_CLASS}Application${NC}"

# Get database name
echo ""
DEFAULT_DB_NAME="${SERVICE_NAME//-/_}"
read -p "Enter database name [$DEFAULT_DB_NAME]: " DB_NAME
DB_NAME=${DB_NAME:-$DEFAULT_DB_NAME}

# Get service description
echo ""
read -p "Enter service description: " SERVICE_DESCRIPTION

# Get Harbor registry path
echo ""
echo -e "${YELLOW}💡 Common paths: minjibir, spay, core${NC}"
read -p "Enter Harbor registry path (e.g., minjibir): " HARBOR_PATH

# Get service title for metadata
SERVICE_TITLE=$(echo "$SERVICE_NAME" | sed 's/-/ /g' | sed 's/\b\w/\u&/g')

echo ""
echo -e "${BLUE}📋 Configuration Summary:${NC}"
echo "Service Name: $SERVICE_NAME"
echo "Package Name: $PACKAGE_NAME"
echo "Service Class: ${SERVICE_CLASS}Application"
echo "Database Name: $DB_NAME"
echo "Service Description: $SERVICE_DESCRIPTION"
echo "Harbor Path: harbor.spaymfb.com/$HARBOR_PATH/$SERVICE_NAME"
echo ""

read -p "Continue with this configuration? (y/N): " CONFIRM
if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Setup cancelled${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🔧 Customizing template...${NC}"

# Create package directory structure
PACKAGE_DIR="src/main/kotlin/$(echo $PACKAGE_NAME | tr '.' '/')"
TEST_PACKAGE_DIR="src/test/kotlin/$(echo $PACKAGE_NAME | tr '.' '/')"

mkdir -p "$PACKAGE_DIR"
mkdir -p "$TEST_PACKAGE_DIR"

# Replace placeholders in files
echo "📝 Updating configuration files..."

# Replace in build.gradle.kts
sed -i.bak "s/{{PACKAGE_NAME}}/$PACKAGE_NAME/g" build.gradle.kts
sed -i.bak "s/{{SERVICE_CLASS}}/$SERVICE_CLASS/g" build.gradle.kts

# Replace in CI workflows
sed -i.bak "s/{{SERVICE_NAME}}/$DB_NAME/g" .github/workflows/main-pipeline.yml
sed -i.bak "s/{{SERVICE_NAME}}/$SERVICE_NAME/g" .github/workflows/main-pipeline.yml
sed -i.bak "s/{{HARBOR_PATH}}/$HARBOR_PATH/g" .github/workflows/main-pipeline.yml
sed -i.bak "s/{{SERVICE_TITLE}}/$SERVICE_TITLE/g" .github/workflows/main-pipeline.yml
sed -i.bak "s/{{SERVICE_DESCRIPTION}}/$SERVICE_DESCRIPTION/g" .github/workflows/main-pipeline.yml

# Update settings.gradle.kts
echo "rootProject.name = \"$SERVICE_NAME\"" > settings.gradle.kts

# Create main application class
cat > "$PACKAGE_DIR/${SERVICE_CLASS}Application.kt" << EOF
package $PACKAGE_NAME

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class ${SERVICE_CLASS}Application

fun main(args: Array<String>) {
    runApplication<${SERVICE_CLASS}Application>(*args)
}
EOF

# Create basic controller
mkdir -p "$PACKAGE_DIR/controller"
cat > "$PACKAGE_DIR/controller/HealthController.kt" << EOF
package $PACKAGE_NAME.controller

import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1")
class HealthController {

    @GetMapping("/health")
    fun health(): ResponseEntity<Map<String, String>> {
        return ResponseEntity.ok(
            mapOf(
                "status" to "UP",
                "service" to "$SERVICE_NAME"
            )
        )
    }
}
EOF

# Create basic test
mkdir -p "$TEST_PACKAGE_DIR/integration"
cat > "$TEST_PACKAGE_DIR/integration/HealthControllerIT.kt" << EOF
package $PACKAGE_NAME.integration

import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.client.TestRestTemplate
import org.springframework.boot.test.web.server.LocalServerPort
import org.springframework.http.HttpStatus
import org.springframework.test.context.ActiveProfiles

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class HealthControllerIT {

    @LocalServerPort
    private var port: Int = 0

    @Autowired
    private lateinit var restTemplate: TestRestTemplate

    @Test
    fun \`health endpoint should return OK\`() {
        val response = restTemplate.getForEntity(
            "http://localhost:\$port/api/v1/health",
            Map::class.java
        )
        
        assert(response.statusCode == HttpStatus.OK)
        assert(response.body?.get("status") == "UP")
        assert(response.body?.get("service") == "$SERVICE_NAME")
    }
}
EOF

# Update application.yml files
mkdir -p src/main/resources
cat > src/main/resources/application.yml << EOF
server:
  port: 8080
  servlet:
    context-path: /

spring:
  application:
    name: $SERVICE_NAME
  profiles:
    active: dev
  datasource:
    url: jdbc:postgresql://localhost:5432/$DB_NAME
    username: postgres
    password: postgres
    driver-class-name: org.postgresql.Driver
  
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true

  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true

management:
  endpoints:
    web:
      exposure:
        include: health,info,prometheus,metrics
  endpoint:
    health:
      show-details: always
  metrics:
    export:
      prometheus:
        enabled: true

logging:
  level:
    $PACKAGE_NAME: INFO
    org.springframework.web: INFO
    org.hibernate.SQL: DEBUG
    org.hibernate.type.descriptor.sql.BasicBinder: TRACE
EOF

# Create test application.yml
mkdir -p src/test/resources
cat > src/test/resources/application-test.yml << EOF
spring:
  datasource:
    url: jdbc:h2:mem:testdb
    driver-class-name: org.h2.Driver
    username: sa
    password: 
  
  jpa:
    hibernate:
      ddl-auto: create-drop
    show-sql: true

  flyway:
    enabled: false

logging:
  level:
    $PACKAGE_NAME: DEBUG
EOF

# Create initial Flyway migration
mkdir -p src/main/resources/db/migration
cat > src/main/resources/db/migration/V1_001__Initial_schema.sql << EOF
-- Initial schema for $SERVICE_NAME
-- Add your tables here

-- Example:
-- CREATE TABLE IF NOT EXISTS users (
--     id SERIAL PRIMARY KEY,
--     email VARCHAR(255) UNIQUE NOT NULL,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );
EOF

# Update docker-compose.yml
sed -i.bak "s/bank_service_test/$DB_NAME/g" docker-compose.yml

# Clean up backup files
find . -name "*.bak" -delete

echo ""
echo -e "${GREEN}✅ Template setup complete!${NC}"
echo ""
echo -e "${BLUE}📝 Next steps:${NC}"
echo "1. Review and customize the generated code"
echo "2. Add your business logic to the controller and services"
echo "3. Update database migrations in src/main/resources/db/migration/"
echo "4. Customize application.yml for your specific needs"
echo "5. Add integration tests for your endpoints"
echo "6. Initialize git repository:"
echo "   git init"
echo "   git add ."
echo "   git commit -m 'initial service setup from spay-springboot-template'"
echo ""
echo -e "${YELLOW}💡 Remember to:${NC}"
echo "- Create GitHub repository: https://github.com/SpayHQ/$SERVICE_NAME"
echo "- Add Harbor registry credentials to GitHub secrets"
echo "- Configure ArgoCD for deployment"
echo ""
echo -e "${GREEN}🎉 Happy coding!${NC}"
EOF