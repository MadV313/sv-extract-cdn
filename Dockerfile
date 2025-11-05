FROM nginx:1.25-alpine

# Copy our nginx config and static files
COPY nginx.conf /etc/nginx/nginx.conf
COPY public /usr/share/nginx/html

# Railway
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
