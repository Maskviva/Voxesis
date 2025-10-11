package v_web_controller

import (
	"crypto/sha256"
	"encoding/hex"
	vwebutils "voxesis/src/Web/Utils"

	"github.com/gin-gonic/gin"
)

func Login(context *gin.Context) {
	var data struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	if err := context.ShouldBindJSON(&data); err != nil {
		context.JSON(400, gin.H{
			"message": "参数错误",
		})
		return
	}

	conf, err := vwebutils.GetAuthConfig()
	if err != nil {
		context.JSON(500, gin.H{
			"message": "获取用户信息失败",
		})
		return
	}

	if data.Username == conf.Username && data.Password == conf.Password {
		hashToken := sha256.Sum256([]byte(conf.Token))
		hexToken := hex.EncodeToString(hashToken[:])

		context.SetCookie(
			"auth",
			hexToken,
			conf.Deadline,
			"/",
			"",
			conf.Secure,
			true,
		)

		context.JSON(200, gin.H{
			"message": "登录成功",
		})
		return
	}

	context.JSON(400, gin.H{
		"message": "用户名或密码错误",
	})
}
