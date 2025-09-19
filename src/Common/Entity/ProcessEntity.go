package entity

type ProcessState struct {
	Pid     string  `json:"pid"`
	Cpu     float64 `json:"cpu"`
	Memory  float64 `json:"memory"`
	RunTime string  `json:"runTime"`
}
