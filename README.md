# Spay Spring Boot Service Template

A production-ready Spring Boot microservice template with optimized CI/CD, comprehensive quality gates, and DevOps best practices.

## Features

### 🚀 Performance Optimized CI/CD
- **Fast PR checks**: 3-5 minute builds (vs 20+ minutes typical)
- **Intelligent caching**: Gradle build cache, configuration cache, dependency cache
- **Parallel execution**: Tests and quality checks run concurrently
- **Weekly security scans**: OWASP dependency checks separated from PR workflow

### 🛡️ Security & Quality
- **Static analysis**: Detekt for Kotlin code quality
- **Code formatting**: ktlint with automated fixes
- **Security scanning**: SpotBugs + OWASP dependency check
- **Test coverage**: JaCoCo with configurable thresholds
- **Quality gates**: Automated pass/fail criteria

### 🏗️ Production Ready
- **Docker support**: Multi-stage builds with layer caching
- **Observability**: Prometheus metrics, OTLP tracing ready
- **Database migrations**: Flyway integration
- **Configuration**: Multi-environment Spring profiles
- **Documentation**: OpenAPI/Swagger integration

### 🔄 DevOps Integration
- **GitOps ready**: ArgoCD integration patterns
- **Registry integration**: Harbor/Docker registry support
- **Secrets management**: GitHub secrets integration
- **Environment promotion**: Dev → Staging → Prod workflows

## Quick Start

### 🚀 NPM/NPX Style (Recommended)

```bash
# Interactive mode - asks questions and generates service
npx create-spay-service

# Quick mode - creates service with defaults  
npx create-spay-service my-payment-service
```

### 🛠️ Manual Setup (Alternative)

```bash
# Clone the template
git clone https://github.com/SpayHQ/spay-springboot-template.git my-new-service
cd my-new-service

# Run the setup script
./scripts/setup-new-service.sh
```

### ⚡ What You Get

The generator will prompt you for:
- **Service name** (e.g., `payment-service`) 
- **Package name** (auto-suggested: `com.spaybusiness.payment.service`)
- **Database name** (auto-suggested: `payment_service`)
- **Service description** (auto-suggested based on name)
- **Harbor registry path** (default: `minjibir`)

### 🔄 Automatic Setup

The tool automatically:
- ✅ Clones template and removes git history
- ✅ Generates package structure and main application class
- ✅ Creates basic REST controller with health endpoint
- ✅ Sets up integration tests
- ✅ Configures database migrations
- ✅ Updates CI/CD workflows with service-specific settings
- ✅ Initializes new git repository with initial commit

## Project Structure

```
├── .github/workflows/          # Optimized CI/CD workflows
│   ├── pr-checks.yml          # Fast PR validation (3-5 min)
│   ├── main-pipeline.yml      # Main branch deployment
│   └── security-scan.yml      # Weekly security scans
├── config/                    # Quality tool configurations
│   ├── detekt/detekt.yml     # Kotlin static analysis rules
│   └── spotbugs/             # Security scan exclusions
├── gradle/                    # Gradle optimization scripts
├── src/main/kotlin/           # Application source code
├── src/test/kotlin/           # Unit and integration tests
├── scripts/                   # Setup and utility scripts
├── Dockerfile                 # Optimized multi-stage build
├── docker-compose.yml         # Local development environment
├── build.gradle.kts          # Optimized build configuration
└── gradle.properties         # Performance tuning settings
```

## CI/CD Workflows

### PR Checks (`pr-checks.yml`)
- **Duration**: 3-5 minutes
- **Triggers**: Pull requests to main
- **Includes**: Tests, coverage, basic quality checks
- **Caching**: Full Gradle and dependency caching

### Main Pipeline (`main-pipeline.yml`)
- **Duration**: 5-8 minutes  
- **Triggers**: Push to main branch
- **Includes**: Tests, build, Docker image, deployment
- **Features**: Multi-stage with dependency management

### Security Scan (`security-scan.yml`)
- **Schedule**: Weekly (Sundays 2 AM)
- **Includes**: OWASP dependency check, vulnerability scanning
- **Alerts**: Creates GitHub issues for findings

## Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=jdbc:postgresql://localhost:5432/your_service_db
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres

# External Services (customize per service)
EXTERNAL_SERVICE_URL=https://api.example.com
EXTERNAL_SERVICE_TOKEN=your-token

# Observability
MANAGEMENT_OTLP_ENDPOINT=http://jaeger:4317
```

### Quality Gate Thresholds

Edit in `build.gradle.kts`:
```kotlin
// Customize for your service requirements
val maxDetektIssues = 50          // Code quality issues
val maxSpotbugsIssues = 0         // Security issues (zero tolerance)
val minCoverage = 80              // Test coverage percentage
```

## Local Development

### Prerequisites
- Java 21
- Docker & Docker Compose
- PostgreSQL (or use Docker Compose)

### Setup
```bash
# Start local dependencies
docker-compose up -d postgres

# Run in development mode
./gradlew bootRun --args='--spring.profiles.active=dev'

# Run tests
./gradlew test

# Run quality checks
./gradlew detekt ktlintCheck spotbugsMain
```

### Development Workflow
1. Create feature branch: `git checkout -b feature/my-feature`
2. Develop with hot reload: `./gradlew bootRun`
3. Run tests locally: `./gradlew test`
4. Push and create PR (triggers automated CI)
5. Merge after CI passes

## Deployment

### Docker Build
```bash
# Build optimized image
docker build -t my-service:latest .

# Multi-platform build
docker buildx build --platform linux/amd64,linux/arm64 -t my-service:latest .
```

### Kubernetes/ArgoCD
The template includes ArgoCD-ready configurations:
- Helm charts in `deploy/helm/`
- Environment-specific values
- GitOps workflow integration

## Customization Guide

### Adding New Dependencies
Update `build.gradle.kts` and maintain version catalog:
```kotlin
// Add to version catalog
val newLibraryVersion = "1.0.0"

dependencies {
    implementation("com.example:new-library:$newLibraryVersion")
}
```

### Database Migrations
Add Flyway migrations in `src/main/resources/db/migration/`:
```sql
-- V1_001__Create_users_table.sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Quality Rules Customization
- **Detekt**: Edit `config/detekt/detekt.yml`
- **ktlint**: Configure in `build.gradle.kts`
- **SpotBugs**: Add exclusions in `config/spotbugs/`

## Troubleshooting

### Common Issues

**CI taking too long?**
- Check Gradle daemon logs
- Verify caching is working
- Consider splitting large test suites

**Quality gate failing?**
- Review Detekt/SpotBugs reports in CI artifacts
- Fix issues or adjust thresholds temporarily
- Use `./gradlew ktlintFormat` for auto-formatting

**Docker build issues?**
- Verify multi-stage build layers
- Check Harbor registry connectivity
- Ensure Docker BuildKit is enabled

## Contributing

1. Fork the template repository
2. Create your feature branch
3. Add/update template components
4. Test with a real service creation
5. Submit PR with clear description

## Support

- **Documentation**: [Internal Wiki](https://wiki.spaybusiness.com/spring-boot-template)
- **Issues**: GitHub Issues in this repository
- **Slack**: #devops-support channel
- **Contacts**: DevOps team

---

**Generated from spay-springboot-template v1.0.0**