# Kerouac - Rails 8 Application

## Overview
Kerouac is a Ruby on Rails 8 application with PostgreSQL database, Devise authentication, and Tailwind CSS styling. The application uses Hotwire (Turbo + Stimulus) for interactive frontend functionality.

## Project Structure
- **app/**: Main application code (models, views, controllers, assets)
- **config/**: Rails configuration files
- **db/**: Database migrations and schema
- **bin/**: Executable scripts

## Tech Stack
- **Ruby**: 3.2.2
- **Rails**: 8.1.2
- **Database**: PostgreSQL (Replit built-in)
- **CSS**: Tailwind CSS 4.x
- **JavaScript**: esbuild with Hotwire (Turbo + Stimulus)
- **Authentication**: Devise

## Development

### Running the Application
The application runs via the `bin/start` script which:
1. Builds JavaScript assets with esbuild
2. Builds CSS with Tailwind
3. Runs database migrations
4. Starts the Puma server on port 5000

### Environment Variables
The application uses `DATABASE_URL` provided by Replit's built-in PostgreSQL database.

### Important Notes
- Ruby gems require libyaml paths to be set (handled in bin/start)
- The development server binds to 0.0.0.0:5000
- Rails is configured to allow all hosts for Replit proxy compatibility

## Database
Uses Replit's built-in PostgreSQL database. Migrations run automatically on server start.

## Recent Changes
- Configured for Replit environment
- Set up database to use DATABASE_URL
- Removed duplicate migrations
- Configured Puma to bind to 0.0.0.0:5000
- Installed Node.js dependencies for asset pipeline
