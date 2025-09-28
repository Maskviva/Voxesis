package v_utils

import (
	"bytes"
	"encoding/binary"
	"fmt"
	"net"
	"strconv"
	"strings"
	"sync"
	"time"
	entity "voxesis/src/Common/Entity"

	"github.com/shirou/gopsutil/v3/process"
)

type ProcessContainer struct {
	mu      sync.Mutex
	process *process.Process
}

// MAGIC Minecraft 基岩版协议常量
var MAGIC = []byte{
	0x00, 0xFF, 0xFF, 0x00, 0xFE, 0xFE, 0xFE, 0xFE,
	0xFD, 0xFD, 0xFD, 0xFD, 0x12, 0x34, 0x56, 0x78,
}

// GetBedrockMcServerStatus 查询 Minecraft 基岩版服务器的状态。
func GetBedrockMcServerStatus(host string, port uint16) (*entity.BedrockMcServerStatus, error) {
	status := entity.BedrockMcServerStatus{}

	// 创建 UDP 链接
	conn, err := net.ListenPacket("udp", ":0")
	if err != nil {
		errStr := fmt.Errorf("无法创建连接: %v", err)
		return nil, errStr
	}
	defer func(conn net.PacketConn) {
		_ = conn.Close()
	}(conn)

	// 设置读取超时
	if err := conn.SetReadDeadline(time.Now().Add(5 * time.Second)); err != nil {
		errStr := fmt.Errorf("设置读取超时失败: %v", err)
		return nil, errStr
	}

	// 解析目标地址
	targetAddr := fmt.Sprintf("%s:%d", host, port)
	serverAddr, err := net.ResolveUDPAddr("udp", targetAddr)
	if err != nil {
		errStr := fmt.Errorf("无法解析地址: %v", err)
		return nil, errStr
	}

	// 构造 Ping 数据包
	var buffer bytes.Buffer
	buffer.WriteByte(0x01) // 未连接的 Ping ID

	// 添加时间戳
	timestamp := time.Now().UnixNano() / int64(time.Millisecond)
	_ = binary.Write(&buffer, binary.BigEndian, timestamp)

	// 添加魔术字节
	buffer.Write(MAGIC)

	// 添加客户端 GUID( 8 字节，共 0 )
	buffer.Write(make([]byte, 8))

	// 发送 Ping 数据包
	if _, err := conn.WriteTo(buffer.Bytes(), serverAddr); err != nil {
		errStr := fmt.Errorf("发送 Ping 数据包失败: %v", err)
		return nil, errStr
	}

	// 接收响应
	responseBuf := make([]byte, 1500)
	size, _, err := conn.ReadFrom(responseBuf)
	if err != nil {
		errStr := fmt.Errorf("接收响应失败: %v", err)
		return nil, errStr
	}

	// 验证响应完整性
	if size < 35 || responseBuf[0] != 0x1c {
		errStr := fmt.Errorf("无效的响应数据包( 大小：%d，ID：%d ) ", size, responseBuf[0])
		return nil, errStr
	}

	// 提取状态字符串
	statusStr := string(responseBuf[35:size])

	// 拆分状态字段
	parts := strings.Split(statusStr, ";")
	if len(parts) < 10 {
		errStr := fmt.Errorf("状态字段数无效: %d", len(parts))
		return nil, errStr
	}

	// 填充服务器状态
	status.MOTD = &parts[1]

	if protocol, err := strconv.ParseInt(parts[2], 10, 32); err == nil {
		p := int32(protocol)
		status.Protocol = &p
	}

	status.Version = &parts[3]

	if online, err := strconv.ParseInt(parts[4], 10, 32); err == nil {
		o := int32(online)
		status.PlayersOnline = &o
	}

	if maxp, err := strconv.ParseInt(parts[5], 10, 32); err == nil {
		m := int32(maxp)
		status.PlayersMax = &m
	}

	status.ServerID = &parts[6]
	status.LevelName = &parts[7]
	status.GameModeID = &parts[8]

	if len(parts) > 10 {
		if port, err := strconv.ParseUint(parts[10], 10, 16); err == nil {
			p := uint16(port)
			status.PortV4 = &p
		}
	}

	if len(parts) > 11 {
		if port, err := strconv.ParseUint(parts[11], 10, 16); err == nil {
			p := uint16(port)
			status.PortV6 = &p
		}
	}

	return &status, err
}
