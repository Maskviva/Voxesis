package entity

type ProcessState struct {
	Pid     string  `json:"pid"`
	Cpu     float64 `json:"cpu"`
	Memory  float64 `json:"memory"`
	RunTime string  `json:"runTime"`
}

type SystemState struct {
	CpuCores    int64
	CpuUsage    float64
	MemoryUsage float64
	OsMemory    float64
}

type BedrockMcServerStatus struct {
	MOTD          *string `json:"motd,omitempty"`
	Protocol      *int32  `json:"protocol,omitempty"`
	Version       *string `json:"version,omitempty"`
	PlayersOnline *int32  `json:"players_online,omitempty"`
	PlayersMax    *int32  `json:"players_max,omitempty"`
	ServerID      *string `json:"server_id,omitempty"`
	LevelName     *string `json:"level_name,omitempty"`
	GameModeID    *string `json:"gamemode_id,omitempty"`
	PortV4        *uint16 `json:"port_v4,omitempty"`
	PortV6        *uint16 `json:"port_v6,omitempty"`
}
