import { nextTick, type Directive } from "vue"

export const vTopText: Directive = {
    mounted(el: HTMLElement) {
        nextTick(() => {
            // 移除旧的文本元素（防止重复）
            const existing = el.querySelector('.top-text-span')
            if (existing) existing.remove()

            // 创建新文本元素
            const textElement = document.createElement('span')
            textElement.classList.add('top-text-span')

            // 正确复制子元素到新 span 中
            Array.from(el.children).forEach(child => {
                textElement.appendChild(child)
            })

            el.prepend(textElement) // 插入到原有内容前

            // 获取实际渲染后的尺寸
            const rect = textElement.getBoundingClientRect()
            const computedStyle = window.getComputedStyle(el)

            const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0
            const paddingRight = parseFloat(computedStyle.paddingRight) || 0
            const paddingTop = parseFloat(computedStyle.paddingTop) || 0
            const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0

            const width = rect.width + paddingLeft + paddingRight
            const height = rect.height + paddingTop + paddingBottom

            // 设置容器尺寸
            el.style.width = `${width}px`
            el.style.height = `${height}px`
        })
    }
}