package v_utils

import (
	"runtime"
	"time"
	entity "voxesis/src/Common/Entity"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/mem"
)

func GetSystemState() (*entity.SystemState, error) {
	state := &entity.SystemState{}

	cpuPercent, err := cpu.Percent(time.Second, false)
	if err != nil {
		return nil, err
	}

	if len(cpuPercent) > 0 {
		state.CpuUsage = cpuPercent[0]
	}

	cpuInfo, err := cpu.Info()
	if err != nil {
		state.CpuCores = int64(runtime.NumCPU())
	} else if len(cpuInfo) > 0 {

		physicalCores, err := cpu.Counts(false)
		if err != nil {
			state.CpuCores = int64(cpuInfo[0].Cores)
		} else {
			state.CpuCores = int64(physicalCores)
		}
	} else {
		state.CpuCores = int64(runtime.NumCPU())
	}

	memStat, err := mem.VirtualMemory()
	if err != nil {
		return nil, err
	}

	state.MemoryUsage = memStat.UsedPercent
	state.OsMemory = float64(memStat.Total) / 1024 / 1024

	return state, nil
}
