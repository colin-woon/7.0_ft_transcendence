# --- Stage 1: Build the JAR ---
FROM eclipse-temurin:21-jdk-noble AS build
WORKDIR /app

# 1. Copy Maven wrapper + pom.xml and download dependencies (Caching layer)
COPY mvnw .
COPY .mvn ./.mvn
COPY pom.xml .
RUN chmod +x mvnw
RUN ./mvnw -q dependency:go-offline

# 2. Copy source code and build
COPY src ./src
# -DskipTests speeds up the build in dev
RUN ./mvnw -q package -DskipTests

# --- Stage 2: Run the Application ---
FROM eclipse-temurin:21-jdk
WORKDIR /app

# 3. Copy the built artifacts from Stage 1
# Note: Quarkus produces a 'quarkus-run.jar' in the target/quarkus-app directory
COPY --from=build /app/target/quarkus-app/lib/ /app/lib/
COPY --from=build /app/target/quarkus-app/*.jar /app/
COPY --from=build /app/target/quarkus-app/app/ /app/app/
COPY --from=build /app/target/quarkus-app/quarkus/ /app/quarkus/

EXPOSE 8080

# 4. Start the app
CMD ["java", "-jar", "quarkus-run.jar"]