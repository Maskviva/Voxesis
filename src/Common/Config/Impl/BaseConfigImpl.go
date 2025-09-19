package v_config_impl

import (
	"context"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/fsnotify/fsnotify"
)

// BaseConfig 配置文件基础类，提供通用的文件操作和监听功能
type BaseConfig struct {
	filePath string            // 配置文件路径
	watcher  *fsnotify.Watcher // 文件监听器
	mutex    sync.RWMutex      // 读写锁，保护文件访问
}

// NewBaseConfig 创建新的基础配置实例
// 确保配置文件和目录存在，并初始化监听器
func NewBaseConfig(filePath string) (*BaseConfig, error) {
	// 确保目录存在
	dir := filepath.Dir(filePath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, err
	}

	// 创建文件（如果不存在）
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		if err := os.WriteFile(filePath, []byte{}, 0644); err != nil {
			return nil, err
		}
	}

	// 初始化文件监听器
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		return nil, err
	}

	return &BaseConfig{
		filePath: filePath,
		watcher:  watcher,
	}, nil
}

// Get 读取配置文件内容
func (c *BaseConfig) Get() ([]byte, error) {
	c.mutex.RLock()
	defer c.mutex.RUnlock()
	return os.ReadFile(c.filePath)
}

// Set 写入数据到配置文件
func (c *BaseConfig) Set(data []byte) error {
	c.mutex.Lock()
	defer c.mutex.Unlock()
	return os.WriteFile(c.filePath, data, 0644)
}

// Path 获取配置文件路径
func (c *BaseConfig) Path() string {
	return c.filePath
}

// Watch 监听配置文件变更
// 当文件被修改或创建时，会触发回调函数
func (c *BaseConfig) Watch(ctx context.Context, callback func([]byte)) error {
	// 添加文件到监听器
	if err := c.watcher.Add(c.filePath); err != nil {
		return err
	}

	// 启动监听协程
	go func() {
		defer c.watcher.Close()

		// 防抖动延迟，避免短时间内重复触发
		var lastEventTime time.Time
		const debounceDuration = 100 * time.Millisecond

		for {
			select {
			case <-ctx.Done():
				return
			case event, ok := <-c.watcher.Events:
				if !ok {
					return
				}

				// 只处理写入和创建事件
				if event.Op&fsnotify.Write == fsnotify.Write ||
					event.Op&fsnotify.Create == fsnotify.Create {
					// 防抖动处理
					if time.Since(lastEventTime) < debounceDuration {
						continue
					}
					lastEventTime = time.Now()

					// 读取文件内容并回调
					if data, err := c.Get(); err == nil {
						callback(data)
					}
				}
			case _, ok := <-c.watcher.Errors:
				if !ok {
					return
				}
				// 错误处理
			}
		}
	}()

	return nil
}

// Close 关闭配置监听器，释放资源
func (c *BaseConfig) Close() error {
	return c.watcher.Close()
}
