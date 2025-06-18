#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// Colors for better UX
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

class SpayServiceCreator {
  constructor() {
    this.config = {};
    this.templateUrl = 'https://github.com/SpayHQ/spay-springboot-template.git';
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  async question(prompt, defaultValue = '') {
    return new Promise((resolve) => {
      const fullPrompt = defaultValue 
        ? `${prompt} (${colors.cyan}${defaultValue}${colors.reset}): `
        : `${prompt}: `;
      
      rl.question(fullPrompt, (answer) => {
        resolve(answer.trim() || defaultValue);
      });
    });
  }

  validateServiceName(name) {
    const regex = /^[a-z][a-z0-9-]*[a-z0-9]$/;
    if (!regex.test(name)) {
      throw new Error('Service name must be lowercase, start with a letter, and contain only letters, numbers, and hyphens');
    }
    return true;
  }

  validatePackageName(name) {
    const regex = /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)*$/;
    if (!regex.test(name)) {
      throw new Error('Package name must be valid Java package format (e.g., com.spaybusiness.payment.service)');
    }
    return true;
  }

  generateServiceClass(serviceName) {
    return serviceName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  generatePackageSuggestion(serviceName) {
    const servicePackage = serviceName.replace(/-/g, '.');
    return `com.spaybusiness.${servicePackage}.service`;
  }

  async collectConfig() {
    this.log('\n🚀 Create Spay Spring Boot Service', 'bright');
    this.log('━'.repeat(50), 'cyan');
    
    // Service name
    while (true) {
      try {
        const serviceName = await this.question(
          `${colors.blue}Service name${colors.reset} ${colors.yellow}(e.g., payment-service)${colors.reset}`
        );
        
        if (!serviceName) {
          this.log('❌ Service name is required', 'red');
          continue;
        }
        
        this.validateServiceName(serviceName);
        this.config.serviceName = serviceName;
        break;
      } catch (error) {
        this.log(`❌ ${error.message}`, 'red');
      }
    }

    // Package name with smart suggestion
    const suggestedPackage = this.generatePackageSuggestion(this.config.serviceName);
    this.log(`\n💡 Suggested package: ${colors.yellow}${suggestedPackage}${colors.reset}`);
    
    while (true) {
      try {
        const packageName = await this.question(
          `${colors.blue}Package name${colors.reset}`,
          suggestedPackage
        );
        
        this.validatePackageName(packageName);
        this.config.packageName = packageName;
        break;
      } catch (error) {
        this.log(`❌ ${error.message}`, 'red');
      }
    }

    // Auto-generate service class
    this.config.serviceClass = this.generateServiceClass(this.config.serviceName);
    this.log(`\n💡 Service class: ${colors.yellow}${this.config.serviceClass}Application${colors.reset}`);

    // Database name with smart default
    const suggestedDb = this.config.serviceName.replace(/-/g, '_');
    this.config.dbName = await this.question(
      `${colors.blue}Database name${colors.reset}`,
      suggestedDb
    );

    // Service description
    this.config.description = await this.question(
      `${colors.blue}Service description${colors.reset}`,
      `Spay ${this.config.serviceName.replace(/-/g, ' ')} microservice`
    );

    // Harbor registry path
    this.log(`\n💡 Common paths: ${colors.yellow}minjibir, spay, core${colors.reset}`);
    this.config.harborPath = await this.question(
      `${colors.blue}Harbor registry path${colors.reset}`,
      'minjibir'
    );

    // Auto-generate service title
    this.config.serviceTitle = this.config.serviceName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  async confirmConfig() {
    this.log('\n📋 Configuration Summary', 'bright');
    this.log('━'.repeat(30), 'cyan');
    this.log(`Service Name:     ${colors.green}${this.config.serviceName}${colors.reset}`);
    this.log(`Package Name:     ${colors.green}${this.config.packageName}${colors.reset}`);
    this.log(`Service Class:    ${colors.green}${this.config.serviceClass}Application${colors.reset}`);
    this.log(`Database Name:    ${colors.green}${this.config.dbName}${colors.reset}`);
    this.log(`Description:      ${colors.green}${this.config.description}${colors.reset}`);
    this.log(`Harbor Registry:  ${colors.green}harbor.spaymfb.com/${this.config.harborPath}/${this.config.serviceName}${colors.reset}`);

    const confirm = await this.question(`\n${colors.blue}Continue with this configuration?${colors.reset} (Y/n)`, 'Y');
    
    if (!confirm.toLowerCase().startsWith('y')) {
      this.log('❌ Setup cancelled', 'red');
      process.exit(1);
    }
  }

  async cloneTemplate() {
    this.log('\n📦 Cloning template...', 'blue');
    
    try {
      // Clone template
      execSync(`git clone ${this.templateUrl} ${this.config.serviceName}`, { stdio: 'pipe' });
      
      // Remove .git directory
      execSync(`rm -rf ${this.config.serviceName}/.git`, { stdio: 'pipe' });
      
      this.log('✅ Template cloned successfully', 'green');
    } catch (error) {
      this.log(`❌ Failed to clone template: ${error.message}`, 'red');
      process.exit(1);
    }
  }

  replaceInFile(filePath, replacements) {
    if (!fs.existsSync(filePath)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    for (const [placeholder, value] of Object.entries(replacements)) {
      content = content.replace(new RegExp(placeholder, 'g'), value);
    }
    
    fs.writeFileSync(filePath, content);
  }

  async customizeTemplate() {
    this.log('\n🔧 Customizing template...', 'blue');
    
    const servicePath = this.config.serviceName;
    const replacements = {
      '{{PACKAGE_NAME}}': this.config.packageName,
      '{{SERVICE_CLASS}}': this.config.serviceClass,
      '{{SERVICE_NAME}}': this.config.serviceName,
      '{{SERVICE_TITLE}}': this.config.serviceTitle,
      '{{SERVICE_DESCRIPTION}}': this.config.description,
      '{{HARBOR_PATH}}': this.config.harborPath,
      '{{DB_NAME}}': this.config.dbName
    };

    // Update configuration files
    this.replaceInFile(`${servicePath}/build.gradle.kts`, replacements);
    this.replaceInFile(`${servicePath}/.github/workflows/main-pipeline.yml`, replacements);
    this.replaceInFile(`${servicePath}/docker-compose.yml`, { '{{DB_NAME}}': this.config.dbName });

    // Update settings.gradle.kts
    fs.writeFileSync(
      `${servicePath}/settings.gradle.kts`,
      `rootProject.name = "${this.config.serviceName}"\n`
    );

    // Create package directory structure
    const packageDir = `${servicePath}/src/main/kotlin/${this.config.packageName.replace(/\./g, '/')}`;
    const testPackageDir = `${servicePath}/src/test/kotlin/${this.config.packageName.replace(/\./g, '/')}`;
    
    fs.mkdirSync(packageDir, { recursive: true });
    fs.mkdirSync(testPackageDir, { recursive: true });

    // Create main application class
    const appClass = `package ${this.config.packageName}

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class ${this.config.serviceClass}Application

fun main(args: Array<String>) {
    runApplication<${this.config.serviceClass}Application>(*args)
}
`;
    fs.writeFileSync(`${packageDir}/${this.config.serviceClass}Application.kt`, appClass);

    // Create basic controller
    fs.mkdirSync(`${packageDir}/controller`, { recursive: true });
    const controller = `package ${this.config.packageName}.controller

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
                "service" to "${this.config.serviceName}"
            )
        )
    }
}
`;
    fs.writeFileSync(`${packageDir}/controller/HealthController.kt`, controller);

    // Create basic test
    fs.mkdirSync(`${testPackageDir}/integration`, { recursive: true });
    const test = `package ${this.config.packageName}.integration

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
        assert(response.body?.get("service") == "${this.config.serviceName}")
    }
}
`;
    fs.writeFileSync(`${testPackageDir}/integration/HealthControllerIT.kt`, test);

    // Create application.yml
    fs.mkdirSync(`${servicePath}/src/main/resources`, { recursive: true });
    const appYml = `server:
  port: 8080
  servlet:
    context-path: /

spring:
  application:
    name: ${this.config.serviceName}
  profiles:
    active: dev
  datasource:
    url: jdbc:postgresql://localhost:5432/${this.config.dbName}
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
    ${this.config.packageName}: INFO
    org.springframework.web: INFO
    org.hibernate.SQL: DEBUG
    org.hibernate.type.descriptor.sql.BasicBinder: TRACE
`;
    fs.writeFileSync(`${servicePath}/src/main/resources/application.yml`, appYml);

    // Create test application.yml
    fs.mkdirSync(`${servicePath}/src/test/resources`, { recursive: true });
    const testAppYml = `spring:
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
    ${this.config.packageName}: DEBUG
`;
    fs.writeFileSync(`${servicePath}/src/test/resources/application-test.yml`, testAppYml);

    // Create initial migration
    fs.mkdirSync(`${servicePath}/src/main/resources/db/migration`, { recursive: true });
    const migration = `-- Initial schema for ${this.config.serviceName}
-- Add your tables here

-- Example:
-- CREATE TABLE IF NOT EXISTS users (
--     id SERIAL PRIMARY KEY,
--     email VARCHAR(255) UNIQUE NOT NULL,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );
`;
    fs.writeFileSync(`${servicePath}/src/main/resources/db/migration/V1_001__Initial_schema.sql`, migration);

    this.log('✅ Template customized successfully', 'green');
  }

  async initializeGit() {
    this.log('\n🔄 Initializing Git repository...', 'blue');
    
    try {
      const servicePath = this.config.serviceName;
      execSync(`cd ${servicePath} && git init && git add . && git commit -m "initial service setup from spay-springboot-template"`, { stdio: 'pipe' });
      this.log('✅ Git repository initialized', 'green');
    } catch (error) {
      this.log(`⚠️  Git initialization failed: ${error.message}`, 'yellow');
    }
  }

  async showNextSteps() {
    this.log('\n🎉 Service created successfully!', 'bright');
    this.log('━'.repeat(40), 'green');
    this.log(`\n📁 Project: ${colors.cyan}${this.config.serviceName}${colors.reset}`);
    this.log(`\n📝 Next steps:`);
    this.log(`   1. ${colors.blue}cd ${this.config.serviceName}${colors.reset}`);
    this.log(`   2. ${colors.blue}docker-compose up -d postgres${colors.reset}`);
    this.log(`   3. ${colors.blue}./gradlew bootRun${colors.reset}`);
    this.log(`   4. ${colors.blue}curl http://localhost:8080/api/v1/health${colors.reset}`);
    this.log(`\n🔗 Create GitHub repository:`);
    this.log(`   ${colors.blue}gh repo create SpayHQ/${this.config.serviceName} --public${colors.reset}`);
    this.log(`   ${colors.blue}git remote add origin https://github.com/SpayHQ/${this.config.serviceName}.git${colors.reset}`);
    this.log(`   ${colors.blue}git push -u origin main${colors.reset}`);
    this.log(`\n💡 Remember to:`);
    this.log(`   • Add Harbor registry credentials to GitHub secrets`);
    this.log(`   • Configure ArgoCD for deployment`);
    this.log(`   • Update database migrations in src/main/resources/db/migration/`);
    this.log(`\n🚀 Happy coding!`, 'bright');
  }

  async run() {
    try {
      await this.collectConfig();
      await this.confirmConfig();
      await this.cloneTemplate();
      await this.customizeTemplate();
      await this.initializeGit();
      await this.showNextSteps();
    } catch (error) {
      this.log(`\n❌ Error: ${error.message}`, 'red');
      process.exit(1);
    } finally {
      rl.close();
    }
  }
}

// Handle CLI arguments for non-interactive mode
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🚀 Create Spay Spring Boot Service

Usage:
  npx create-spay-service                    # Interactive mode
  npx create-spay-service my-service         # Quick start with service name
  
Options:
  -h, --help                                 # Show this help

Examples:
  npx create-spay-service
  npx create-spay-service payment-service
  
Repository: https://github.com/SpayHQ/spay-springboot-template
  `);
  process.exit(0);
}

// Quick start mode if service name provided
if (args.length > 0) {
  const creator = new SpayServiceCreator();
  creator.config.serviceName = args[0];
  
  try {
    creator.validateServiceName(args[0]);
    creator.config.packageName = creator.generatePackageSuggestion(args[0]);
    creator.config.serviceClass = creator.generateServiceClass(args[0]);
    creator.config.dbName = args[0].replace(/-/g, '_');
    creator.config.description = `Spay ${args[0].replace(/-/g, ' ')} microservice`;
    creator.config.harborPath = 'minjibir';
    creator.config.serviceTitle = creator.generateServiceClass(args[0]);
    
    console.log('🚀 Quick creating service with defaults...');
    creator.cloneTemplate()
      .then(() => creator.customizeTemplate())
      .then(() => creator.initializeGit())
      .then(() => creator.showNextSteps())
      .catch(error => {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
      });
  } catch (error) {
    console.error(`❌ ${error.message}`);
    process.exit(1);
  }
} else {
  // Interactive mode
  const creator = new SpayServiceCreator();
  creator.run();
}