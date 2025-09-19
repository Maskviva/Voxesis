import type { Directive } from "vue"

interface elType extends HTMLElement {
    _clearRipple?: () => void
}

export const vRipple: Directive = {
    mounted(el: elType) {
        const handleRipple = (e: MouseEvent) => {
            const rippleElement = document.createElement('span')
            rippleElement.classList.add('ripple')

            // 获取点击位置相对于元素的位置
            const size = Math.sqrt(el.offsetWidth ** 2 + el.offsetHeight ** 2) * 2 // 对角线距离

            const rect = el.getBoundingClientRect()
            const x = e.clientX - rect.left + 'px'
            const y = e.clientY - rect.top + 'px'

            // 设置初始位置和尺寸
            rippleElement.style.left = x
            rippleElement.style.top = y
            rippleElement.style.width = '2px'
            rippleElement.style.height = '2px'

            el.appendChild(rippleElement)

            // 强制重排以触发动画
            void rippleElement.offsetWidth

            // 应用缩放和透明度变化
            rippleElement.style.transform = `scale(${size / 2})`
            rippleElement.style.opacity = '0'
            
            // 动画结束后移除元素
            const duration = 800
            setTimeout(() => {
                rippleElement.remove()
            }, duration)
        }

        el.addEventListener('click', handleRipple)

        // 绑定清除方法，用于 unmount 时移除残留元素
        el._clearRipple = () => {
            el.removeEventListener('click', handleRipple)
            el.querySelectorAll('.ripple').forEach(span => span.remove())
        }
    },
    beforeUnmount(el: elType) {
        el._clearRipple?.()
    }
}