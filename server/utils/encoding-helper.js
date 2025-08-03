const iconv = require('iconv-lite');
const { execSync } = require('child_process');

/**
 * Encoding Helper Utility
 * Handles character encoding issues, especially for Japanese text on Windows
 */

// Detect Windows system encoding
function getSystemEncoding() {
  try {
    // Try to detect Windows code page
    const chcp = execSync('chcp', { encoding: 'ascii' }).toString();
    const match = chcp.match(/\d+/);
    if (match) {
      const codePage = parseInt(match[0]);
      switch (codePage) {
        case 932: return 'shift_jis';
        case 65001: return 'utf8';
        case 1252: return 'windows-1252';
        default: return 'shift_jis'; // Default to Shift_JIS for Japanese Windows
      }
    }
  } catch (error) {
    console.warn('Could not detect system encoding:', error.message);
  }
  
  // Fallback detection based on system locale
  const locale = process.env.LANG || process.env.LC_ALL || 'ja_JP';
  if (locale.includes('ja') || locale.includes('JP')) {
    return 'shift_jis';
  }
  
  return 'utf8';
}

// Convert buffer to UTF-8 string
function bufferToUtf8(buffer, sourceEncoding = null) {
  if (!buffer || buffer.length === 0) {
    return '';
  }
  
  // Auto-detect encoding if not specified
  if (!sourceEncoding) {
    sourceEncoding = getSystemEncoding();
  }
  
  try {
    // If it's already UTF-8, just convert to string
    if (sourceEncoding === 'utf8') {
      return buffer.toString('utf8');
    }
    
    // Convert from source encoding to UTF-8
    if (iconv.encodingExists(sourceEncoding)) {
      return iconv.decode(buffer, sourceEncoding);
    } else {
      console.warn(`Unknown encoding: ${sourceEncoding}, falling back to utf8`);
      return buffer.toString('utf8');
    }
  } catch (error) {
    console.warn('Encoding conversion failed:', error.message);
    
    // Fallback: try common encodings
    const fallbackEncodings = ['shift_jis', 'utf8', 'ascii'];
    
    for (const encoding of fallbackEncodings) {
      try {
        if (encoding === 'utf8' || encoding === 'ascii') {
          return buffer.toString(encoding);
        } else if (iconv.encodingExists(encoding)) {
          return iconv.decode(buffer, encoding);
        }
      } catch (fallbackError) {
        continue;
      }
    }
    
    // Last resort: return as-is with replacement characters
    return buffer.toString('utf8', 0, buffer.length);
  }
}

// Clean up text output for terminal display
function cleanTerminalOutput(text) {
  return text
    // Remove ANSI escape codes
    .replace(/\x1b\[[0-9;]*m/g, '')
    // Remove carriage returns that might cause display issues
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove null characters
    .replace(/\0/g, '')
    // Normalize whitespace at the end of lines
    .replace(/[ \t]+$/gm, '');
}

// Configure spawn options for proper encoding
function getSpawnOptions(additionalOptions = {}) {
  const systemEncoding = getSystemEncoding();
  
  return {
    shell: true,
    env: {
      ...process.env,
      // Force UTF-8 output when possible
      PYTHONIOENCODING: 'utf-8',
      // Set console code page for Windows
      ...(process.platform === 'win32' && {
        CHCP: '65001' // UTF-8 code page
      })
    },
    // Don't set encoding on spawn options, we'll handle it manually
    encoding: null,
    ...additionalOptions
  };
}

// Test encoding detection
function testEncoding() {
  console.log('Encoding Detection Test:');
  console.log(`- System encoding: ${getSystemEncoding()}`);
  console.log(`- Platform: ${process.platform}`);
  console.log(`- LANG: ${process.env.LANG || 'not set'}`);
  console.log(`- LC_ALL: ${process.env.LC_ALL || 'not set'}`);
  
  // Test with sample Japanese text
  const testText = 'こんにちは世界'; // "Hello World" in Japanese
  const testBuffer = Buffer.from(testText, 'utf8');
  
  console.log('- Test conversion:');
  console.log(`  Original: ${testText}`);
  console.log(`  Converted: ${bufferToUtf8(testBuffer, 'utf8')}`);
  console.log(`  Match: ${testText === bufferToUtf8(testBuffer, 'utf8')}`);
}

module.exports = {
  getSystemEncoding,
  bufferToUtf8,
  cleanTerminalOutput,
  getSpawnOptions,
  testEncoding
};