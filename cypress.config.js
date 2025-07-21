import { defineConfig } from 'cypress';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    env: {
      apiUrl: 'http://localhost:3001'
    },
    setupNodeEvents(on, config) {
      // Task para resetar dados do banco
      on('task', {
        resetDatabase() {
          const seedPath = path.join(process.cwd(), 'db.seed.json');
          const dbPath = path.join(process.cwd(), 'db.json');
          
          try {
            // Copia o arquivo seed para o db.json
            const seedData = fs.readFileSync(seedPath, 'utf8');
            fs.writeFileSync(dbPath, seedData, 'utf8');
            console.log('✅ Database reset successfully');
            return { success: true, message: 'Database reset successfully' };
          } catch (error) {
            console.error('❌ Error resetting database:', error);
            return { success: false, error: error.message };
          }
        },
      }
      )
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
        resetDatabase() {
          const seedPath = path.join(process.cwd(), 'db.seed.json');
          const dbPath = path.join(process.cwd(), 'db.json');
          
          try {
            // Copia o arquivo seed para o db.json
            const seedData = fs.readFileSync(seedPath, 'utf8');
            fs.writeFileSync(dbPath, seedData, 'utf8');
            console.log('✅ Database reset successfully');
            return { success: true, message: 'Database reset successfully' };
          } catch (error) {
            console.error('❌ Error resetting database:', error);
            return { success: false, error: error.message };
          }
        }
      });
    }
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite'
    }
  }
});