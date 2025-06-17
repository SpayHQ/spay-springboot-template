
FROM eclipse-temurin:21-jdk-alpine AS extractor
WORKDIR /workspace
# Copy pre-built JAR from CI/build context
COPY build/libs/*.jar application.jar
# Extract layers using Spring Boot's built-in tooling
RUN java -Djarmode=tools -jar application.jar extract --layers --destination extracted

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
# Copy extracted layers in order of least to most likely to change
COPY --from=extractor /workspace/extracted/dependencies/ ./
COPY --from=extractor /workspace/extracted/spring-boot-loader/ ./
COPY --from=extractor /workspace/extracted/snapshot-dependencies/ ./
COPY --from=extractor /workspace/extracted/application/ ./
# For Spring Boot 3.5, use the standard jar execution approach
ENTRYPOINT ["java", "-jar", "application.jar"]
