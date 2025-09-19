import type { Directive } from "vue"

interface elType extends HTMLElement {
    _clearHover?: () => void
}

export const vHover: Directive = {
    mounted(el: elType) {
        let childEl: HTMLSpanElement | null = null
        let size = 0
        const createHover = (e: MouseEvent) => {
            // 清理旧的 hover
            el.querySelectorAll('.hover').forEach(span => span.remove())

            const hoverElement = document.createElement('span')
            childEl = hoverElement
            hoverElement.classList.add('hover')

            const offsetX = e.offsetX
            const offsetY = e.offsetY
            size = Math.sqrt(el.offsetWidth ** 2 + el.offsetHeight ** 2) * 2 / 2

            hoverElement.style.left = `${offsetX}px`
            hoverElement.style.top = `${offsetY}px`
            hoverElement.style.width = `${size}px`
            hoverElement.style.height = `${size}px`

            el.appendChild(hoverElement)

            return hoverElement
        }

        const handleMouseMove = (e: MouseEvent) => {
            if (!childEl) return
            const rect = el.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top

            childEl.style.left = `${x - size / 2}px`
            childEl.style.top = `${y - size / 2}px`
        }

        const handleMouseEnter = (e: MouseEvent) => {
            createHover(e)
            handleMouseMove(e) // 初始位置设置

            // 添加 mousemove 监听器
            el.addEventListener('mousemove', handleMouseMove)
        }

        const handleMouseLeave = () => {
            if (childEl) {
                childEl.remove()
                childEl = null
            }

            // 移除 mousemove 避免内存泄漏
            el.removeEventListener('mousemove', handleMouseMove)
        }

        // 绑定事件
        el.addEventListener('mouseenter', handleMouseEnter)
        el.addEventListener('mouseleave', handleMouseLeave)

        // 解绑方法
        el._clearHover = () => {
            el.removeEventListener('mouseenter', handleMouseEnter)
            el.removeEventListener('mouseleave', handleMouseLeave)
            el.removeEventListener('mousemove', handleMouseMove)
            el.querySelectorAll('.hover').forEach(span => span.remove())
        }
    },
    beforeUnmount(el: elType) {
        el._clearHover?.()
    }
}