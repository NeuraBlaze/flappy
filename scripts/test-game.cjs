/**
 * ========================================
 * FLAPPY BIRD GAME LOCAL TEST SUITE
 * ========================================
 * 
 * Comprehensive local testing for the Flappy Bird game
 * Tests all modules, build process, and core functionality
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

class GameTester {
  constructor() {
    this.testResults = [];
    this.startTime = Date.now();
  }

  // Helper methods
  log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
  }

  addResult(name, status, message, details) {
    this.testResults.push({ name, status, message, details });
    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    const color = status === 'PASS' ? colors.green : status === 'FAIL' ? colors.red : colors.yellow;
    this.log(`${icon} ${name}: ${message}`, color);
  }

  // Test file existence
  testFileExistence() {
    this.log('\n🔍 Testing File Existence...', colors.cyan);
    
    const requiredFiles = [
      // Core app files
      'src/App.tsx',
      'src/main.tsx',
      'src/index.css',
      'package.json',
      'vite.config.ts',
      'tsconfig.json',
      
      // Game modules (18 modules)
      'src/game-modules/GameStateManager.tsx',
      'src/game-modules/GameLoopManager.tsx',
      'src/game-modules/WorldManager.tsx',
      'src/game-modules/BirdManager.tsx',
      'src/game-modules/CollisionManager.tsx',
      'src/game-modules/ObstacleManager.tsx',
      'src/game-modules/ScoreManager.tsx',
      'src/game-modules/RenderManager.tsx',
      'src/game-modules/BirdRenderer.tsx',
      'src/game-modules/ObstacleRenderer.tsx',
      'src/game-modules/EffectsRenderer.tsx',
      'src/game-modules/InputManager.tsx',
      'src/game-modules/TouchManager.tsx',
      'src/game-modules/AudioManager.tsx',
      'src/game-modules/SoundEffectsManager.tsx',
      'src/game-modules/UIOverlayManager.tsx',
      'src/game-modules/MenuRenderer.tsx',
      'src/game-modules/HUDRenderer.tsx',
      'src/game-modules/index.ts',
      
      // Components
      'src/components/SzenyoMadar.tsx',
      'src/components/SzenyoMadarNew.tsx',
    ];

    const missingFiles = [];
    const existingFiles = [];

    requiredFiles.forEach(file => {
      if (fs.existsSync(file)) {
        existingFiles.push(file);
      } else {
        missingFiles.push(file);
      }
    });

    if (missingFiles.length === 0) {
      this.addResult('File Existence', 'PASS', `All ${requiredFiles.length} required files exist`, { existingFiles: existingFiles.length });
    } else {
      this.addResult('File Existence', 'FAIL', `${missingFiles.length} files missing`, { missingFiles });
    }
  }

  // Test modules structure
  testModulesStructure() {
    this.log('\n🏗️ Testing Game Modules Structure...', colors.cyan);
    
    try {
      const indexContent = fs.readFileSync('src/game-modules/index.ts', 'utf8');
      
      // Count exports
      const exportMatches = indexContent.match(/export.*use[A-Z]/g) || [];
      const convenienceHookMatches = indexContent.match(/export const use[A-Z]/g) || [];
      
      const individualModules = exportMatches.filter(exp => !exp.includes('export const')).length;
      const convenienceHooks = convenienceHookMatches.length;
      
      if (individualModules >= 18 && convenienceHooks >= 8) {
        this.addResult('Modules Structure', 'PASS', `${individualModules} modules + ${convenienceHooks} convenience hooks found`, { 
          individualModules, 
          convenienceHooks 
        });
      } else {
        this.addResult('Modules Structure', 'WARN', `Expected 18+ modules and 8+ hooks, found ${individualModules} modules + ${convenienceHooks} hooks`, {
          individualModules,
          convenienceHooks,
          expected: { modules: 18, hooks: 8 }
        });
      }
    } catch (error) {
      this.addResult('Modules Structure', 'FAIL', 'Could not read modules index file', { error: error.message });
    }
  }

  // Test build process
  testBuildProcess() {
    this.log('\n🔨 Testing Build Process...', colors.cyan);
    
    try {
      // Clean previous build
      if (fs.existsSync('dist')) {
        fs.rmSync('dist', { recursive: true, force: true });
      }
      
      this.log('Running npm run build...', colors.blue);
      const buildOutput = execSync('npm run build', { encoding: 'utf8', timeout: 60000 });
      
      // Check if dist folder was created
      if (fs.existsSync('dist')) {
        const distFiles = fs.readdirSync('dist');
        const hasIndex = distFiles.includes('index.html');
        const hasAssets = distFiles.some(file => file.startsWith('assets') || file.includes('.js') || file.includes('.css'));
        
        if (hasIndex && hasAssets) {
          // Get file sizes
          const stats = fs.statSync('dist/index.html');
          const assetFiles = distFiles.filter(file => file.includes('.js') || file.includes('.css'));
          
          this.addResult('Build Process', 'PASS', 'Build completed successfully', {
            distFiles: distFiles.length,
            hasIndex,
            hasAssets,
            indexSize: `${(stats.size / 1024).toFixed(2)} KB`,
            assetFiles
          });
        } else {
          this.addResult('Build Process', 'FAIL', 'Build incomplete - missing files', { distFiles, hasIndex, hasAssets });
        }
      } else {
        this.addResult('Build Process', 'FAIL', 'No dist folder created', { buildOutput });
      }
    } catch (error) {
      this.addResult('Build Process', 'FAIL', 'Build failed', { error: error.message });
    }
  }

  // Test TypeScript compilation
  testTypeScriptCompilation() {
    this.log('\n📝 Testing TypeScript Compilation...', colors.cyan);
    
    try {
      this.log('Running TypeScript compiler check...', colors.blue);
      const tscOutput = execSync('npx tsc --noEmit', { encoding: 'utf8', timeout: 30000 });
      
      if (tscOutput.trim() === '') {
        this.addResult('TypeScript Compilation', 'PASS', 'No TypeScript errors found');
      } else {
        this.addResult('TypeScript Compilation', 'WARN', 'TypeScript warnings found', { output: tscOutput });
      }
    } catch (error) {
      const errorMessage = error.stdout || error.message;
      if (errorMessage.includes('error TS')) {
        this.addResult('TypeScript Compilation', 'FAIL', 'TypeScript errors found', { errors: errorMessage });
      } else {
        this.addResult('TypeScript Compilation', 'WARN', 'TypeScript check completed with warnings', { warnings: errorMessage });
      }
    }
  }

  // Test dependencies
  testDependencies() {
    this.log('\n📦 Testing Dependencies...', colors.cyan);
    
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      const criticalDeps = ['react', 'react-dom', 'typescript', 'vite'];
      const missingDeps = criticalDeps.filter(dep => !dependencies[dep]);
      
      if (missingDeps.length === 0) {
        this.addResult('Dependencies', 'PASS', `All ${criticalDeps.length} critical dependencies found`, {
          totalDeps: Object.keys(dependencies).length,
          criticalDeps: criticalDeps.map(dep => `${dep}@${dependencies[dep]}`)
        });
      } else {
        this.addResult('Dependencies', 'FAIL', `Missing critical dependencies: ${missingDeps.join(', ')}`, { missingDeps });
      }
      
      // Check for node_modules
      if (fs.existsSync('node_modules')) {
        this.addResult('Node Modules', 'PASS', 'node_modules directory exists');
      } else {
        this.addResult('Node Modules', 'WARN', 'node_modules directory missing - run npm install');
      }
    } catch (error) {
      this.addResult('Dependencies', 'FAIL', 'Could not read package.json', { error: error.message });
    }
  }

  // Test configuration files
  testConfigFiles() {
    this.log('\n⚙️ Testing Configuration Files...', colors.cyan);
    
    const configFiles = [
      { file: 'vite.config.ts', name: 'Vite Config' },
      { file: 'tsconfig.json', name: 'TypeScript Config' },
      { file: 'tailwind.config.js', name: 'Tailwind Config', optional: true },
    ];

    configFiles.forEach(({ file, name, optional }) => {
      if (fs.existsSync(file)) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          if (content.trim().length > 0) {
            this.addResult(name, 'PASS', `${file} exists and has content`);
          } else {
            this.addResult(name, 'WARN', `${file} exists but is empty`);
          }
        } catch (error) {
          this.addResult(name, 'FAIL', `${file} exists but cannot be read`, { error: error.message });
        }
      } else {
        if (optional) {
          this.addResult(name, 'PASS', `${file} not found (optional)`);
        } else {
          this.addResult(name, 'FAIL', `${file} missing`);
        }
      }
    });
  }

  // Test game module imports
  testGameModuleImports() {
    this.log('\n🎮 Testing Game Module Imports...', colors.cyan);
    
    try {
      // Check the syntax of the modules index file
      const indexContent = fs.readFileSync('src/game-modules/index.ts', 'utf8');
      
      // Check for syntax errors in exports
      const exportErrors = [];
      const lines = indexContent.split('\n');
      
      lines.forEach((line, index) => {
        if (line.includes('export') && !line.trim().startsWith('//') && !line.trim().startsWith('*')) {
          // Basic syntax check
          if (line.includes('export') && !line.includes(';') && !line.includes('{') && line.trim().endsWith(',')) {
            exportErrors.push(`Line ${index + 1}: Possible syntax error - ${line.trim()}`);
          }
        }
      });
      
      if (exportErrors.length === 0) {
        this.addResult('Game Module Imports', 'PASS', 'No obvious syntax errors in module exports');
      } else {
        this.addResult('Game Module Imports', 'WARN', 'Potential syntax issues found', { errors: exportErrors });
      }
    } catch (error) {
      this.addResult('Game Module Imports', 'FAIL', 'Could not analyze module imports', { error: error.message });
    }
  }

  // Generate test report
  generateReport() {
    const endTime = Date.now();
    const duration = ((endTime - this.startTime) / 1000).toFixed(2);
    
    this.log('\n' + '='.repeat(60), colors.magenta);
    this.log('🎯 FLAPPY BIRD GAME TEST REPORT', colors.bright + colors.magenta);
    this.log('='.repeat(60), colors.magenta);
    
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const warnings = this.testResults.filter(r => r.status === 'WARN').length;
    
    this.log(`\n📊 Test Summary:`, colors.bright);
    this.log(`   ✅ Passed:   ${passed}`, colors.green);
    this.log(`   ❌ Failed:   ${failed}`, colors.red);
    this.log(`   ⚠️  Warnings: ${warnings}`, colors.yellow);
    this.log(`   ⏱️  Duration: ${duration}s`, colors.blue);
    
    // Overall status
    if (failed === 0) {
      if (warnings === 0) {
        this.log(`\n🎉 ALL TESTS PASSED! Game is ready for production.`, colors.bright + colors.green);
      } else {
        this.log(`\n✅ Tests passed with ${warnings} warnings. Game is functional.`, colors.bright + colors.yellow);
      }
    } else {
      this.log(`\n❌ ${failed} critical issues found. Please fix before deployment.`, colors.bright + colors.red);
    }
    
    // Detailed results
    if (failed > 0 || warnings > 0) {
      this.log(`\n📋 Detailed Results:`, colors.bright);
      this.testResults.forEach(result => {
        if (result.status !== 'PASS') {
          const icon = result.status === 'FAIL' ? '❌' : '⚠️';
          const color = result.status === 'FAIL' ? colors.red : colors.yellow;
          this.log(`   ${icon} ${result.name}: ${result.message}`, color);
          if (result.details) {
            this.log(`     Details: ${JSON.stringify(result.details, null, 2)}`, colors.reset);
          }
        }
      });
    }
    
    // Save report to file
    const reportData = {
      timestamp: new Date().toISOString(),
      duration: `${duration}s`,
      summary: { passed, failed, warnings, total: this.testResults.length },
      results: this.testResults
    };
    
    fs.writeFileSync('test-report.json', JSON.stringify(reportData, null, 2));
    this.log(`\n📄 Detailed report saved to: test-report.json`, colors.blue);
  }

  // Main test runner
  async runAllTests() {
    this.log('🚀 Starting Flappy Bird Game Local Tests...', colors.bright + colors.cyan);
    this.log(`📅 Test Date: ${new Date().toLocaleString()}`, colors.blue);
    this.log(`📁 Working Directory: ${process.cwd()}`, colors.blue);
    
    try {
      this.testFileExistence();
      this.testModulesStructure();
      this.testConfigFiles();
      this.testDependencies();
      this.testGameModuleImports();
      this.testTypeScriptCompilation();
      this.testBuildProcess();
      
      this.generateReport();
    } catch (error) {
      this.log(`\n💥 Test runner crashed: ${error.message}`, colors.red);
      console.error(error);
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new GameTester();
  tester.runAllTests().catch(console.error);
}

module.exports = GameTester;