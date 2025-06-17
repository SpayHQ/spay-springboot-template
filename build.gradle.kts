plugins {
    val kotlinVersion = "2.0.10"  // Compatible with Detekt 1.23.7
    val springBootVersion = "3.5.0"
    val dependencyManagementVersion = "1.1.7"
    val detektVersion = "1.23.7"
    val ktlintVersion = "12.1.2"
    val spotbugsVersion = "6.0.26"
    val owaspVersion = "10.0.4"

    kotlin("jvm") version kotlinVersion
    kotlin("plugin.spring") version kotlinVersion
    kotlin("plugin.jpa") version kotlinVersion
    id("org.springframework.boot") version springBootVersion
    id("io.spring.dependency-management") version dependencyManagementVersion

    // Code Quality Plugins
    id("io.gitlab.arturbosch.detekt") version detektVersion
    id("org.jlleitschuh.gradle.ktlint") version ktlintVersion
    id("com.github.spotbugs") version spotbugsVersion
    id("jacoco")
    id("org.owasp.dependencycheck") version owaspVersion
}

// Configure Spring Boot specific properties
springBoot {
    mainClass.set("{{PACKAGE_NAME}}.{{SERVICE_CLASS}}ApplicationKt")  // Will be replaced by setup script
}

group = "{{PACKAGE_NAME}}"  // Will be replaced by setup script
version = "0.0.1-SNAPSHOT"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

// Keep explicit versions only for non-Spring dependencies
val kotlinLoggingVersion = "7.0.3"
val springdocVersion = "2.7.0"
val hibernateTypesVersion = "2.20.0"
val commonsLang3Version = "3.14.0"
val mockkVersion = "1.13.11"
val logstashLogbackVersion = "8.0"
val detektFormattingVersion = "1.23.7"

// Code Quality Configuration
detekt {
    toolVersion = "1.23.7"
    config.setFrom(file("config/detekt/detekt.yml"))
    buildUponDefaultConfig = true
    allRules = false
    source.setFrom(files("src/main/kotlin", "src/test/kotlin"))
    parallel = true
}

tasks.withType<io.gitlab.arturbosch.detekt.Detekt>().configureEach {
    reports {
        html.required.set(true)
        xml.required.set(true)
        txt.required.set(false)
        sarif.required.set(false)
        md.required.set(false)
    }
}

ktlint {
    version.set("1.5.0")
    android.set(false)
    ignoreFailures.set(false)
    reporters {
        reporter(org.jlleitschuh.gradle.ktlint.reporter.ReporterType.PLAIN)
        reporter(org.jlleitschuh.gradle.ktlint.reporter.ReporterType.CHECKSTYLE)
    }
    filter {
        exclude("**/generated/**")
        include("**/kotlin/**")
    }
}

spotbugs {
    ignoreFailures.set(false)
    effort.set(com.github.spotbugs.snom.Effort.MAX)
    reportLevel.set(com.github.spotbugs.snom.Confidence.LOW)
    excludeFilter.set(file("config/spotbugs/spotbugs-exclude.xml"))
}

tasks.spotbugsMain {
    reports.create("html") {
        required.set(true)
        outputLocation.set(file("${layout.buildDirectory.get()}/reports/spotbugs/spotbugs.html"))
        setStylesheet("fancy-hist.xsl")
    }
    reports.create("xml") {
        required.set(true)
        outputLocation.set(file("${layout.buildDirectory.get()}/reports/spotbugs/spotbugs.xml"))
    }
}

jacoco {
    toolVersion = "0.8.12"
}

dependencyCheck {
    autoUpdate = true
    format = "ALL"
    outputDirectory = "${layout.buildDirectory.get()}/reports/owasp"
    suppressionFile = "config/owasp/dependency-check-suppressions.xml"

    analyzers {
        // Enable/disable specific analyzers
        centralEnabled = true
        assemblyEnabled = false
        msbuildEnabled = false
        nuspecEnabled = false
        nodeEnabled = false
        retirejs.enabled = false
    }

    data {
        directory = "${layout.buildDirectory.get()}/owasp-data"
    }
}

tasks.jacocoTestReport {
    dependsOn(tasks.test)
    reports {
        xml.required.set(true)
        html.required.set(true)
        csv.required.set(false)
    }
}

tasks.jacocoTestCoverageVerification {
    violationRules {
        rule {
            limit {
                minimum = "0.10".toBigDecimal()  // Adjust for your service requirements
            }
            excludes =
                listOf(
                    "{{PACKAGE_NAME}}.exception.*",
                    "{{PACKAGE_NAME}}.{{SERVICE_CLASS}}ApplicationKt",
                    "{{PACKAGE_NAME}}.config.*",
                )
        }
    }
}

repositories {
    mavenCentral()
}

dependencies {
    // Spring Boot dependencies - Core web service stack
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-web")

    // Optional: Add based on service needs
    // implementation("org.springframework.boot:spring-boot-starter-amqp")
    // implementation("org.springframework.boot:spring-boot-starter-data-redis")
    // implementation("org.springframework.boot:spring-boot-starter-security")

    // Observability (runtime only as per Spring Boot convention)
    runtimeOnly("io.micrometer:micrometer-registry-otlp")
    runtimeOnly("io.micrometer:micrometer-registry-prometheus")

    // Kotlin
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-reactor")

    // Database
    implementation("org.flywaydb:flyway-core")
    implementation("org.flywaydb:flyway-database-postgresql")
    runtimeOnly("org.postgresql:postgresql")

    // Logging and utilities
    implementation("io.github.oshai:kotlin-logging-jvm:$kotlinLoggingVersion")
    implementation("net.logstash.logback:logstash-logback-encoder:$logstashLogbackVersion")
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:$springdocVersion")
    implementation("com.vladmihalcea:hibernate-types-60:$hibernateTypesVersion")
    implementation("org.apache.commons:commons-lang3:$commonsLang3Version")

    // Test dependencies
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.boot:spring-boot-testcontainers")
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit5")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
    testImplementation("io.mockk:mockk:$mockkVersion")

    // Testcontainers
    testImplementation("org.testcontainers:junit-jupiter")
    testImplementation("org.testcontainers:postgresql")
    // testImplementation("org.testcontainers:rabbitmq")  // Add if using RabbitMQ

    // Code Quality
    detektPlugins("io.gitlab.arturbosch.detekt:detekt-formatting:$detektFormattingVersion")
}

kotlin {
    compilerOptions {
        freeCompilerArgs.addAll("-Xjsr305=strict")
    }
}

allOpen {
    annotation("jakarta.persistence.Entity")
    annotation("jakarta.persistence.MappedSuperclass")
    annotation("jakarta.persistence.Embeddable")
}

tasks.withType<org.springframework.boot.gradle.tasks.bundling.BootJar> {
    layered {
        enabled.set(true)
    }
}

// Test task configuration
tasks.withType<Test> {
    useJUnitPlatform()
}

// Create separate test tasks for unit and integration tests
val unitTest by tasks.registering(Test::class) {
    description = "Run unit tests"
    group = "verification"
    useJUnitPlatform()

    // Exclude tests whose class name ends with IT
    exclude("**/*IT.class")

    testClassesDirs =
        sourceSets.test
            .get()
            .output.classesDirs
    classpath = sourceSets.test.get().runtimeClasspath

    reports {
        junitXml.outputLocation.set(file("${layout.buildDirectory.get()}/test-results/unit"))
        html.outputLocation.set(file("${layout.buildDirectory.get()}/reports/tests/unit"))
    }
}

val integrationTest by tasks.registering(Test::class) {
    description = "Run integration tests"
    group = "verification"
    useJUnitPlatform()

    // Include only tests whose class name ends with IT
    include("**/*IT.class")

    testClassesDirs =
        sourceSets.test
            .get()
            .output.classesDirs
    classpath = sourceSets.test.get().runtimeClasspath

    reports {
        junitXml.outputLocation.set(file("${layout.buildDirectory.get()}/test-results/integration"))
        html.outputLocation.set(file("${layout.buildDirectory.get()}/reports/tests/integration"))
    }

    shouldRunAfter(unitTest)
}

// Configure JaCoCo for both test types
tasks.jacocoTestReport {
    dependsOn(unitTest, integrationTest)
    executionData.setFrom(fileTree(layout.buildDirectory).include("/jacoco/*.exec"))
    reports {
        xml.required.set(true)
        html.required.set(true)
        csv.required.set(false)
    }
}

// Update main test task to run both
tasks.test {
    dependsOn(unitTest, integrationTest)
}

// Fast quality metrics generation for CI
val qualityMetrics by tasks.registering {
    group = "verification"
    description = "Generate quality metrics summary for CI"
    dependsOn(tasks.detekt, tasks.ktlintCheck, tasks.spotbugsMain, tasks.jacocoTestReport)
    
    doLast {
        val summaryFile = file("quality-summary.md")
        summaryFile.writeText("## 📊 Code Quality Metrics\n\n")
        
        // Simple metrics extraction
        val detektIssues = try {
            val detektXml = file("${layout.buildDirectory.get()}/reports/detekt/detekt.xml")
            if (detektXml.exists()) {
                detektXml.readText().split("<error").size - 1
            } else 0
        } catch (_: Exception) { 0 }
        
        val spotbugsIssues = try {
            val spotbugsXml = file("${layout.buildDirectory.get()}/reports/spotbugs/spotbugs.xml")
            if (spotbugsXml.exists()) {
                spotbugsXml.readText().split("<BugInstance").size - 1
            } else 0
        } catch (_: Exception) { 0 }
        
        summaryFile.appendText("🔍 **Detekt Issues**: $detektIssues\n")
        summaryFile.appendText("🐛 **SpotBugs Issues**: $spotbugsIssues\n")
        summaryFile.appendText("✨ **ktlint Issues**: Check workflow logs\n")
        summaryFile.appendText("📈 **Test Coverage**: Check JaCoCo report\n\n")
        summaryFile.appendText("📋 **Quality Reports Available in artifacts**\n")
    }
}

// Fast quality gate check for CI
val qualityGateCheck by tasks.registering {
    group = "verification"
    description = "Fast quality gate check for CI"
    dependsOn(tasks.detekt, tasks.spotbugsMain, tasks.jacocoTestReport)
    
    doLast {
        val maxDetektIssues = 50         // Adjust per service
        val maxSpotbugsIssues = 0        // Zero tolerance for security issues
        
        var fail = false
        
        // Check Detekt
        val detektIssues = try {
            val detektXml = file("${layout.buildDirectory.get()}/reports/detekt/detekt.xml")
            if (detektXml.exists()) {
                detektXml.readText().split("<error").size - 1
            } else 0
        } catch (_: Exception) { 0 }
        
        if (detektIssues > maxDetektIssues) {
            println("❌ Quality Gate FAILED: Detekt issues ($detektIssues) exceed threshold ($maxDetektIssues)")
            fail = true
        }
        
        // Check SpotBugs
        val spotbugsIssues = try {
            val spotbugsXml = file("${layout.buildDirectory.get()}/reports/spotbugs/spotbugs.xml")
            if (spotbugsXml.exists()) {
                spotbugsXml.readText().split("<BugInstance").size - 1
            } else 0
        } catch (_: Exception) { 0 }
        
        if (spotbugsIssues > maxSpotbugsIssues) {
            println("❌ Quality Gate FAILED: SpotBugs security issues found ($spotbugsIssues)")
            fail = true
        }
        
        if (fail) {
            throw GradleException("💥 Quality Gate FAILED - Please fix the issues above")
        } else {
            println("✅ Quality Gate PASSED - All checks successful!")
        }
    }
}