package v_config_impl

import (
	"bufio"
	"context"
	"fmt"
	"strings"
	vconfig "voxesis/src/Common/Config"
)

// BasePropertiesImpl Properties配置文件管理类，继承自BaseConfigImpl
type BasePropertiesImpl struct {
	*BaseConfigImpl // 嵌入基础配置类
}

// NewBasePropertiesImpl 创建新的Properties配置实例
func NewBasePropertiesImpl(filePath string) (*BasePropertiesImpl, error) {
	// 创建基础配置实例
	BaseConfigImpl, err := NewBaseConfigImpl(filePath)
	if err != nil {
		return nil, err
	}

	// 验证Properties文件内容
	if err := validateProperties(BaseConfigImpl); err != nil {
		return nil, err
	}

	return &BasePropertiesImpl{
		BaseConfigImpl: BaseConfigImpl,
	}, nil
}

// validateProperties 验证Properties文件内容
func validateProperties(config *BaseConfigImpl) error {
	data, err := config.Get()
	if err != nil {
		return err
	}

	// 如果文件为空，无需验证
	if len(data) == 0 {
		return nil
	}

	// 尝试解析Properties内容
	_, err = parseProperties(string(data))
	return err
}

// parseProperties 解析Properties内容为键值对映射
func parseProperties(content string) (map[string]string, error) {
	properties := make(map[string]string)
	scanner := bufio.NewScanner(strings.NewReader(content))

	lineNumber := 0
	for scanner.Scan() {
		lineNumber++
		line := strings.TrimSpace(scanner.Text())

		// 跳过空行和注释行
		if line == "" || strings.HasPrefix(line, "#") || strings.HasPrefix(line, "!") {
			continue
		}

		// 查找等号或冒号分隔符
		var key, value string
		if idx := strings.Index(line, "="); idx != -1 {
			key = strings.TrimSpace(line[:idx])
			value = strings.TrimSpace(line[idx+1:])
		} else if idx := strings.Index(line, ":"); idx != -1 {
			key = strings.TrimSpace(line[:idx])
			value = strings.TrimSpace(line[idx+1:])
		} else {
			// 没有分隔符，整行作为key，value为空
			key = strings.TrimSpace(line)
		}

		if key != "" {
			// 处理转义字符
			unescapedValue, err := unescapeValue(value)
			if err != nil {
				return nil, fmt.Errorf("line %d: %v", lineNumber, err)
			}
			properties[key] = unescapedValue
		}
	}

	return properties, scanner.Err()
}

// unescapeValue 处理Properties中的转义字符
func unescapeValue(value string) (string, error) {
	if !strings.Contains(value, "\\") {
		return value, nil
	}

	var result strings.Builder
	for i := 0; i < len(value); i++ {
		if value[i] == '\\' && i+1 < len(value) {
			i++
			switch value[i] {
			case 'n':
				result.WriteByte('\n')
			case 'r':
				result.WriteByte('\r')
			case 't':
				result.WriteByte('\t')
			case '\\':
				result.WriteByte('\\')
			case '=':
				result.WriteByte('=')
			case ':':
				result.WriteByte(':')
			case ' ':
				result.WriteByte(' ')
			case '#':
				result.WriteByte('#')
			case '!':
				result.WriteByte('!')
			default:
				// 其他情况保留原样
				result.WriteByte('\\')
				result.WriteByte(value[i])
			}
		} else {
			result.WriteByte(value[i])
		}
	}

	return result.String(), nil
}

// escapeValue 转义Properties中的特殊字符
func escapeValue(value string) string {
	// 替换需要转义的字符
	value = strings.ReplaceAll(value, "\\", "\\\\")
	value = strings.ReplaceAll(value, "\n", "\\n")
	value = strings.ReplaceAll(value, "\r", "\\r")
	value = strings.ReplaceAll(value, "\t", "\\t")
	value = strings.ReplaceAll(value, "=", "\\=")
	value = strings.ReplaceAll(value, ":", "\\:")
	value = strings.ReplaceAll(value, "#", "\\#")
	value = strings.ReplaceAll(value, "!", "\\!")
	return value
}

// GetProperties 读取Properties配置并解析为map[string]string
func (p *BasePropertiesImpl) GetProperties() (map[string]string, error) {
	data, err := p.Get()
	if err != nil {
		return nil, err
	}

	return parseProperties(string(data))
}

// SetProperties 将map[string]string序列化为Properties格式并写入配置文件
func (p *BasePropertiesImpl) SetProperties(props map[string]string) error {
	var content strings.Builder

	for key, value := range props {
		// 转义key和value中的特殊字符
		escapedKey := escapeValue(key)
		escapedValue := escapeValue(value)
		content.WriteString(fmt.Sprintf("%s=%s\n", escapedKey, escapedValue))
	}

	return p.Set([]byte(content.String()))
}

// GetProperty 获取Properties中的特定属性值
func (p *BasePropertiesImpl) GetProperty(key string) (string, error) {
	props, err := p.GetProperties()
	if err != nil {
		return "", err
	}

	value, exists := props[key]
	if !exists {
		return "", fmt.Errorf("property key '%s' not found", key)
	}

	return value, nil
}

// SetProperty 设置Properties中的特定属性值
func (p *BasePropertiesImpl) SetProperty(key, value string) error {
	props, err := p.GetProperties()
	if err != nil {
		// 如果读取失败，创建一个新的map
		props = make(map[string]string)
	}

	props[key] = value
	return p.SetProperties(props)
}

// HasProperty 检查是否存在指定的属性
func (p *BasePropertiesImpl) HasProperty(key string) (bool, error) {
	props, err := p.GetProperties()
	if err != nil {
		return false, err
	}

	_, exists := props[key]
	return exists, nil
}

// DeleteProperty 删除指定的属性
func (p *BasePropertiesImpl) DeleteProperty(key string) error {
	props, err := p.GetProperties()
	if err != nil {
		return err
	}

	delete(props, key)
	return p.SetProperties(props)
}

// WatchProperties 监听配置文件变更并解析为map[string]string
func (p *BasePropertiesImpl) WatchProperties(ctx context.Context, callback func(map[string]string)) error {
	return p.Watch(ctx, func(data []byte) {
		if props, err := parseProperties(string(data)); err == nil {
			callback(props)
		}
	})
}

// WatchProperty 监听配置文件变更并获取特定属性的值
func (p *BasePropertiesImpl) WatchProperty(ctx context.Context, key string, callback func(string)) error {
	return p.Watch(ctx, func(data []byte) {
		if props, err := parseProperties(string(data)); err == nil {
			if value, exists := props[key]; exists {
				callback(value)
			}
		}
	})
}

// 验证接口实现
var _ vconfig.BaseProperties = (*BasePropertiesImpl)(nil)
