package v_data_impl

import (
	"database/sql"
	"fmt"
	"log"

	_ "modernc.org/sqlite"
)

func a() {
	// 1. 打开数据库连接
	// 数据源名称（DSN）就是数据库文件的路径。
	// 如果文件不存在，sqlite 会自动创建它。
	// 可以使用 ":memory:" 作为 DSN 来创建一个内存数据库（重启后数据丢失）。
	db, err := sql.Open("sqlite", "./test.db")
	if err != nil {
		log.Fatal(err)
	}
	// 使用 defer 确保在函数退出前关闭数据库连接，释放资源
	defer db.Close()

	// 2. 测试连接是否成功
	err = db.Ping()
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("Successfully connected to the database!")

	// 3. 执行 CREATE TABLE 语句
	createTableSQL := `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `
	_, err = db.Exec(createTableSQL)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("Table created or already exists!")

	// 4. 插入数据 (使用参数化查询，防止SQL注入)
	insertSQL := "INSERT INTO users (username, email) VALUES (?, ?)"
	result, err := db.Exec(insertSQL, "alice", "alice@example.com")
	if err != nil {
		log.Fatal(err)
	}
	id, _ := result.LastInsertId()
	fmt.Printf("Inserted a row with ID: %d\n", id)

	// 5. 查询数据
	querySQL := "SELECT id, username, email, created_at FROM users"
	rows, err := db.Query(querySQL)
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close() // 确保查询结果集被关闭

	fmt.Println("\nQuery results:")
	for rows.Next() {
		var (
			id        int
			username  string
			email     string
			createdAt string
		)
		err = rows.Scan(&id, &username, &email, &createdAt)
		if err != nil {
			log.Fatal(err)
		}
		fmt.Printf("ID: %d, Username: %s, Email: %s, Created: %s\n", id, username, email, createdAt)
	}
	// 检查在迭代过程中是否发生错误
	err = rows.Err()
	if err != nil {
		log.Fatal(err)
	}

	// 6. 查询单行数据
	var count int
	err = db.QueryRow("SELECT COUNT(*) FROM users").Scan(&count)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("\nTotal users: %d\n", count)
}
