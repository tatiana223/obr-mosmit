FROM node:24-alpine AS frontend-build
WORKDIR /build/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build


FROM maven:3.9.11-eclipse-temurin-21 AS backend-build
WORKDIR /build

COPY pom.xml ./
RUN mvn -B dependency:go-offline

COPY src ./src
COPY --from=frontend-build /build/frontend/dist/ ./src/main/resources/static/
RUN mvn -B clean package -DskipTests


FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

COPY --from=backend-build /build/target/obr-mosmit-0.0.1-SNAPSHOT.jar app.jar

ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=70 -XX:+UseSerialGC"
EXPOSE 8081

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
