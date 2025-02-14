import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import nextjs from '@next/eslint-plugin-next'
import js from '@eslint/js'
import reactRecommended from 'eslint-plugin-react/configs/recommended.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// 基礎配置
const baseConfig = {
  // 繼承的規則集
  extends: [
    ...compat.extends("next/core-web-vitals"), // Next.js 核心規則
    "eslint:recommended", // ESLint 推薦規則
    "plugin:react/recommended", // React 推薦規則
    "plugin:react-hooks/recommended", // React Hooks 推薦規則
    "plugin:jsx-a11y/recommended", // 無障礙存取規則
  ],

  // 解析器設定
  parserOptions: {
    ecmaVersion: "latest", // 使用最新的 ECMAScript 版本
    sourceType: "module", // 使用 ES 模組
    ecmaFeatures: {
      jsx: true, // 支援 JSX
    },
  },

  // 插件
  plugins: {
    react: "react",
    "react-hooks": "react-hooks",
    "jsx-a11y": "jsx-a11y",
    next: nextjs,
  },

  // 自定義規則
  rules: {
    // React 相關
    "react/react-in-jsx-scope": "off", // 不需要在 JSX 文件中導入 React
    "react/prop-types": "off", // 關閉 prop-types 驗證
    "react/jsx-filename-extension": ["warn", { extensions: [".js", ".jsx"] }], // 允許的 JSX 文件副檔名
    
    // React Hooks 相關
    "react-hooks/rules-of-hooks": "error", // Hooks 規則檢查
    "react-hooks/exhaustive-deps": "warn", // useEffect 依賴項檢查
    
    // JavaScript 相關
    "no-unused-vars": "warn",
    "no-console": ["warn", { allow: ["warn", "error"] }], // 限制 console 使用
    "prefer-const": "warn", // 建議使用 const
    "no-var": "error", // 禁止使用 var
    
    // 程式碼風格
    "semi": ["error", "always"], // 要求使用分號
    "quotes": ["error", "single"], // 使用單引號
    "indent": ["error", 2], // 縮排使用 2 空格
    "comma-dangle": ["error", "always-multiline"], // 多行時要求尾隨逗號
    
    // 空白和格式
    "no-trailing-spaces": "error", // 禁止行尾空格
    "eol-last": "error", // 文件結尾需要空行
    "object-curly-spacing": ["error", "always"], // 物件字面量空格
    
    // ES6+ 特性
    "arrow-body-style": ["error", "as-needed"], // 箭頭函式簡寫
    "arrow-parens": ["error", "always"], // 箭頭函式參數括號
    
    // 匯入/匯出
    "import/prefer-default-export": "off", // 允許非預設匯出
    "import/no-unresolved": "off", // 關閉模組解析檢查
  },

  // 設定
  settings: {
    react: {
      version: "detect", // 自動檢測 React 版本
    },
  },

  // 忽略的文件和目錄
  ignores: ['node_modules/', '.next/', 'out/'],
};

// 最終配置
const eslintConfig = [
  // 基礎 JavaScript 規則
  js.configs.recommended,
  
  // React 推薦規則
  reactRecommended,

  // 自定義配置
  {
    files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
    
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        document: 'readonly',
        window: 'readonly',
        process: 'readonly',
        console: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    plugins: {
      next: nextjs,
    },

    // 放寬一些規則
    rules: {
      // React 相關
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/display-name': 'off',
      
      // JavaScript 相關
      'no-unused-vars': 'warn',
      'no-console': 'off',
      'no-undef': 'warn',
      
      // ES6+ 相關
      'prefer-const': 'warn',
      'no-var': 'warn',
      
      // 格式相關
      'semi': 'warn',
      'quotes': ['warn', 'single'],
      'indent': ['warn', 2],
      
      // 其他
      'no-empty': 'warn',
      'no-extra-semi': 'warn',
    },

    settings: {
      react: {
        version: 'detect',
      },
    },

    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'public/**',
      'dist/**',
      'build/**',
    ],
  },
];

export default eslintConfig;
