import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import SignaturePadLib from 'signature_pad'

const SignaturePad = forwardRef(function SignaturePad(_props, ref) {
  const canvasRef = useRef(null)
  const padRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ratio = Math.max(window.devicePixelRatio || 1, 1)
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * ratio
      canvas.height = rect.height * ratio
      canvas.getContext('2d').scale(ratio, ratio)
      padRef.current?.clear()
    }
    padRef.current = new SignaturePadLib(canvas, {
      penColor: '#0b0f1a',
      backgroundColor: '#ffffff',
      minWidth: 1.1,
      maxWidth: 3.0,
    })
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  useImperativeHandle(ref, () => ({
    clear: () => padRef.current?.clear(),
    isEmpty: () => padRef.current?.isEmpty() ?? true,
    toDataURL: () => padRef.current?.toDataURL('image/png'),
  }))

  return <canvas ref={canvasRef} className="w-full h-full rounded-2xl bg-white touch-none" />
})

export default SignaturePad
