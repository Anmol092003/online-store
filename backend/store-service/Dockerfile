FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY target/store-service-1.0.0.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "-Dspring.profiles.active=docker", "app.jar"]
