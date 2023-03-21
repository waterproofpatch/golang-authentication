package app

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/solywsh/chatgpt"
)

func chatgptGetWateringFruencyByPlantName(name string) (float64, error) {
	chat := chatgpt.New(getApiKey(), "user_id(not required)", 30*time.Second)
	defer chat.Close()
	//
	//select {
	//case <-chat.GetDoneChan():
	//	fmt.Println("time out/finish")
	//}
	// question := "How often should I water a ZZ plant"
	question := fmt.Sprintf("How often shuld I water a %s plant? Answer in JSON, and include a single integer representing the number of days between watering in the JSON key 'waterFrequency'.", name)
	fmt.Printf("Q: %s\n", question)
	answer, err := chat.Chat(question)
	if err != nil {
		fmt.Printf("Error: %s", err)
		return 0, err
	}
	fmt.Printf("A: %s\n", answer)
	var jsonObject map[string]interface{}
	err = json.Unmarshal([]byte(answer), &jsonObject)
	if err != nil {
		fmt.Println(err)
		return 0, err
	}
	return jsonObject["waterFrequency"].(float64), nil

}
