package v_utils

import (
	"time"
)

// RateLimitBuffer 速率限制缓冲器
type RateLimitBuffer struct {
	ch       chan interface{}
	callback func(interface{})
}

// NewRateLimitBuffer 创建一个新的速率限制缓冲器
// interval: 输出间隔时间
// callback: 处理输出的回调函数
func NewRateLimitBuffer(interval time.Duration, callback func(interface{})) *RateLimitBuffer {
	rlb := &RateLimitBuffer{
		ch:       make(chan interface{}, 1000), // 缓冲通道
		callback: callback,
	}

	go rlb.start(interval)
	return rlb
}

// Add 添加数据到缓冲区
func (rlb *RateLimitBuffer) Add(data interface{}) {
	select {
	case rlb.ch <- data:
	default:
		// 如果通道满了，丢弃数据避免阻塞
	}
}

// start 启动处理循环
func (rlb *RateLimitBuffer) start(interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for range ticker.C {
		select {
		case data := <-rlb.ch:
			rlb.callback(data)
		default:
			// 没有数据可处理
		}
	}
}
