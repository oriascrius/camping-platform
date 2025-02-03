'use client'
import { useEffect } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'

export default function ClientBootstrap() {
  useEffect(() => {
    // 確保在客戶端環境中
    if (typeof window !== 'undefined') {
      // 使用 async 函數來動態引入
      const initBootstrap = async () => {
        const { Modal } = await import('bootstrap')
        // 初始化所有現有和未來的 Modal
        document.body.addEventListener('show.bs.modal', (event) => {
          const modal = Modal.getInstance(event.target) || new Modal(event.target)
        })
      }
      
      initBootstrap()
    }
  }, [])
  
  return null
} 