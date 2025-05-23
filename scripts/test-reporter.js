// Custom Vitest reporter for grouped test output
import { relative } from 'path';

/**
 * A custom reporter for Vitest that groups tests by feature
 */
export default class FeatureReporter {
  constructor() {
    this.results = {
      vision: [],
      motor: [],
      cognitive: [],
      core: []
    };
    this.totalTests = 0;
    this.passedTests = 0;
  }

  onInit(ctx) {
    console.log('\n🧪 Running Accessibility Extension Tests...\n');
  }

  // Categorize the test based on name/file
  categorizeTest(filepath, name) {
    const relativePath = relative(process.cwd(), filepath);
    
    if (name.toLowerCase().includes('high contrast') || 
        name.toLowerCase().includes('dyslexia') ||
        name.toLowerCase().includes('reduced motion') ||
        name.toLowerCase().includes('text scal') ||
        name.toLowerCase().includes('reading guide') ||
        name.toLowerCase().includes('line height') ||
        name.toLowerCase().includes('color blind')) {
      return 'vision';
    } 
    else if (name.toLowerCase().includes('keyboard') ||
        name.toLowerCase().includes('large target') ||
        name.toLowerCase().includes('click target') ||
        name.toLowerCase().includes('cursor') ||
        name.toLowerCase().includes('scroll') ||
        name.toLowerCase().includes('hover')) {
      return 'motor';
    }
    else if (name.toLowerCase().includes('focus mode') ||
        name.toLowerCase().includes('highlight link') ||
        name.toLowerCase().includes('image description') ||
        name.toLowerCase().includes('reading progress')) {
      return 'cognitive';
    }
    else {
      return 'core';
    }
  }
  
  onTestComplete(test) {
    this.totalTests++;
    
    if (test.state === 'pass') {
      this.passedTests++;
      const category = this.categorizeTest(test.filepath, test.name);
      this.results[category].push({
        name: test.name,
        file: relative(process.cwd(), test.filepath)
      });
    }
  }

  onFinished(files, errors) {
    console.log(`\n✅ Test Results: ${this.passedTests}/${this.totalTests} tests passed\n`);
    
    // Vision Support Features
    if (this.results.vision.length > 0) {
      console.log('📋 Vision Support Features');
      this.results.vision.forEach(test => {
        console.log(`  ✓ PASS: ${test.name}`);
      });
      console.log('');
    }
    
    // Motor Support Features
    if (this.results.motor.length > 0) {
      console.log('📋 Motor Support Features');
      this.results.motor.forEach(test => {
        console.log(`  ✓ PASS: ${test.name}`);
      });
      console.log('');
    }
    
    // Cognitive Support Features
    if (this.results.cognitive.length > 0) {
      console.log('📋 Cognitive Support Features');
      this.results.cognitive.forEach(test => {
        console.log(`  ✓ PASS: ${test.name}`);
      });
      console.log('');
    }
    
    // Core Extension Functionality
    if (this.results.core.length > 0) {
      console.log('📋 Core Extension Functionality');
      this.results.core.forEach(test => {
        console.log(`  ✓ PASS: ${test.name}`);
      });
      console.log('');
    }
    
    console.log(`\n✨ Completed in ${Date.now()}ms\n`);
  }
}
