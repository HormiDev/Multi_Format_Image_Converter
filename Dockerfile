FROM nginx:1.27-alpine

LABEL org.opencontainers.image.title="Hormi Image Converter"
LABEL org.opencontainers.image.description="Conversor de imagenes web local y offline"
LABEL org.opencontainers.image.licenses="MIT"

COPY src/ /usr/share/nginx/html/

EXPOSE 80
