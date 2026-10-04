FROM php:8.2-apache

# Installer les extensions PDO MySQL
RUN docker-php-ext-install pdo pdo_mysql

# Activer mod_rewrite
RUN a2enmod rewrite

# Copier le code de l'API dans le dossier web d'Apache
COPY api/ /var/www/html/

# Exposer le port 80
EXPOSE 80

