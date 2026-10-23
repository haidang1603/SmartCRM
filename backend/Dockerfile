# ==============================================================================
# SmartCRM Backend - Multi-stage Production Dockerfile
# Base Image: Eclipse Temurin OpenJDK 21
# ==============================================================================

# Stage 1: Build JAR package
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app

# Cache Maven dependencies layer
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

# Copy source code and build production jar
COPY src ./src
RUN ./mvnw clean package -DskipTests

# Stage 2: Minimal hardened runtime image
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Install wget for container healthcheck
RUN apk add --no-cache wget

# Create dedicated non-root application user & group
RUN addgroup -S smartcrm && adduser -S smartcrm -G smartcrm

# Create persistent storage directory for report exports
RUN mkdir -p /app/storage/reports && chown -R smartcrm:smartcrm /app

USER smartcrm

# Copy executable jar from builder stage
COPY --from=builder --chown=smartcrm:smartcrm /app/target/*.jar app.jar

ENV SPRING_PROFILES_ACTIVE=prod
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -q --spider http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
