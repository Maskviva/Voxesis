package v_utils

import (
	"bytes"
	"io/ioutil"
	"net/http"
	"time"
)

type RequestType string

const (
	GET    RequestType = "GET"
	POST   RequestType = "POST"
	PUT    RequestType = "PUT"
	DELETE RequestType = "DELETE"
	PATCH  RequestType = "PATCH"
)

type HttpRequestOptions struct {
	Url     string
	Method  RequestType
	Headers map[string]string
	Body    string
	Timeout int
}

func HttpRequest(options HttpRequestOptions) (string, error) {
	// 创建自定义 HTTP 客户端（带超时）
	client := &http.Client{
		Timeout: time.Duration(options.Timeout) * time.Second,
	}

	// 创建请求体
	var req *http.Request
	var err error

	if options.Body != "" {
		req, err = http.NewRequest(
			string(options.Method),
			options.Url,
			bytes.NewBufferString(options.Body),
		)
	} else {
		req, err = http.NewRequest(
			string(options.Method),
			options.Url,
			nil,
		)
	}

	if err != nil {
		return "", err
	}

	// 设置请求头
	for key, value := range options.Headers {
		req.Header.Set(key, value)
	}

	// 发送请求
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	// 读取响应体
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	return string(body), nil
}
