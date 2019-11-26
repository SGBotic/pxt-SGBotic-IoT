/**
* Makecode extension for ThingSpeak IoT
* website https://thingspeak.com/
*/

namespace SGBotic {

let wifi_connected: boolean = false
    let thingspeak_connected: boolean = false
    let last_upload_successful: boolean = false
    let actuatorActivated: boolean = false
    
    let channel_id: string
    let field7Data: number
    let field8Data: number
    let field7_str:string
    let field8_str:string
    
    let tspkURL: string = "api.thingspeak.com";
    let cmdStr: string
    
  
    // write AT command with CR+LF ending
    function sendAT(command: string, wait: number = 100) {
        serial.writeString(command + "\u000D\u000A")
        basic.pause(wait)
    }

    // wait for certain response from ESP8266
    function waitResponse(): boolean {
        let serial_str: string = ""
        let result: boolean = false
        let time: number = input.runningTime()
        while (true) {
            serial_str += serial.readString()
            if (serial_str.length > 200) serial_str = serial_str.substr(serial_str.length - 200)
            if (serial_str.includes("OK") || serial_str.includes("ALREADY CONNECTED")) {
                result = true
                break
            } else if (serial_str.includes("ERROR") || serial_str.includes("SEND FAIL")) {
                break
            }
            if (input.runningTime() - time > 30000) break
        }
        return result
    }

    /**
    * Initialize ESP8266 module and connect it to Wifi router
    */
    //% subcategory=IoT
    //% block="setup ESP module|ESP RX %tx|ESP TX %rx|Wifi SSID %ssid|Wifi Password %pw|Channel ID %channelID"
    //% tx.defl=SerialPin.P0
    //% rx.defl=SerialPin.P1
    //% ssid.defl=your_ssid
    //% pw.defl=your_pw
    //% channelID.defl=your_channel_id
    export function connectWifi(tx: SerialPin, rx: SerialPin, ssid: string, pw: string, channelID: string) {
      
        wifi_connected = false
        thingspeak_connected = false
        serial.redirect(
            tx,
            rx,
            BaudRate.BaudRate115200
        )
        channel_id = channelID
        //sendAT("AT+RESTORE", 1000) // restore to factory settings
        sendAT("AT+CWMODE=1") // set to STA (station or client) mode
        //sendAT("AT+RST", 1000) // reset
        sendAT("AT+CWJAP=\"" + ssid + "\",\"" + pw + "\"", 0) // connect to Wifi router
        wifi_connected = waitResponse()
        basic.pause(100)
    }

    /**
    * Connect to ThingSpeak and write data. It would not write anything if it failed to connect to Wifi or ThingSpeak.
    */
    //% subcategory=IoT
    //% block="write data to ThingSpeak server|Write API key = %write_api_key|Field 1 = %n1|Field 2 = %n2|Field 3 = %n3|Field 4 = %n4|Field 5 = %n5|Field 6 = %n6|Field 7 = %n7"
    //% write_api_key.defl=your_write_api_key
    export function writeThingSpeak(write_api_key: string, n1: number, n2: number, n3: number, n4: number, n5: number, n6: number, n7: number) {
               
        if (wifi_connected && write_api_key != "") {
            thingspeak_connected = false
            //connect to thingspeak server
            cmdStr = "AT+CIPSTART=\"TCP\",\"" + tspkURL + "\",80"
            serial.writeString(cmdStr + "\u000D\u000A");
            thingspeak_connected = waitResponse()
            basic.pause(100)
            
            if (thingspeak_connected) {
                last_upload_successful = false
                let str: string = "GET /update?api_key=" + write_api_key + "&field1=" + n1 + "&field2=" + n2 + "&field3=" + n3 + "&field4=" + n4 + "&field5=" + n5 + "&field6=" + n6 + "&field7=" + n7/* + "&field8=" + n8*/
                
                cmdStr = "AT+CIPSEND=" + (str.length + 2)
                serial.writeString(cmdStr + "\u000D\u000A");   
                serial.writeString(str + "\u000D\u000A");
                
                last_upload_successful = waitResponse()
                basic.pause(100)
            }
        }
    }
    
    /**
    * Read Field 7
    * Connect to ThingSpeak and read data. It would not read anything if it failed to connect to Wifi or ThingSpeak.
    */
    /*
    //% subcategory=IoT
    //% block="read field 7"
    export function readField7():number {
        
        let strPos: number
        let str: string = ""
        
        field7_str = "empty"
        
        if (wifi_connected && channel_id != "") {
            thingspeak_connected = false
            //connect to thingspeak server
            cmdStr = "AT+CIPSTART=\"TCP\",\"" + tspkURL + "\",80"
            serial.writeString(cmdStr + "\u000D\u000A");
            
            thingspeak_connected = waitResponse()
            basic.pause(100)
            if (thingspeak_connected) {
               
                let str: string = "GET /channels/" + channel_id +
                "/fields/7/last"
                
                cmdStr = "AT+CIPSEND=" + (str.length + 2)
                serial.writeString(cmdStr + "\u000D\u000A");
                
                serial.writeString(str + "\u000D\u000A");
                
                let time: number = input.runningTime()
                
                while (true) {
                    field7_str += serial.readString()
                    if (field7_str.length > 200)
                    {
                        field7_str = field7_str.substr(field7_str.length - 200)
                    }
                    if (field7_str.includes("CLOSED"))
                    {
                        break
                    }
                    if (input.runningTime() - time > 30000) 
                        break
                }
               
                if (field7_str.includes("IPD"))
                {
                     strPos = field7_str.indexOf("IPD")
                     if(field7_str.charCodeAt(strPos + 4) == 49)
                     {
                        field7Data = field7_str.charCodeAt(strPos + 6) - 48
                     }else 
                     {
                        field7Data = 99;
                     }
                }else
                {
                    field7Data = 99;
                }
               
                basic.pause(100)
            }
        }
        return field7Data
    }
    */
    /**
    * Read Field 8
    * Connect to ThingSpeak and read data. It would not read anything if it failed to connect to Wifi or ThingSpeak.
    */
    //% subcategory=IoT
    //% block="actuator on?"
    export function readField8(){
        let ip: string = "api.thingspeak.com";
        let str2Pos: number
        let str2: string = ""
        
        field8_str = "empty"
        
        if (wifi_connected && channel_id != "") {
            thingspeak_connected = false
            //connect to thingspeak server
             cmdStr = "AT+CIPSTART=\"TCP\",\"" + tspkURL + "\",80"
            serial.writeString(cmdStr + "\u000D\u000A");
            
            thingspeak_connected = waitResponse()
            basic.pause(100)
            if (thingspeak_connected) {
               
                let str2: string = "GET /channels/" + channel_id +
                "/fields/8/last"
                
                cmdStr = "AT+CIPSEND=" + (str2.length + 2)
                serial.writeString(cmdStr + "\u000D\u000A");           
                serial.writeString(str2 + "\u000D\u000A");
                
                let time: number = input.runningTime()
                
                while (true) {
                    field8_str += serial.readString()
                    if (field8_str.length > 200)
                    {
                        field8_str = field8_str.substr(field8_str.length - 200)
                    }
                    if (field8_str.includes("CLOSED"))
                    {
                        break
                    }
                    if (input.runningTime() - time > 30000) 
                        break
                }
                
               
                if (field8_str.includes("IPD"))
                {
                     str2Pos = field8_str.indexOf("IPD")
                     if(field8_str.charCodeAt(str2Pos + 4) == 49)
                     {
                        field8Data = field8_str.charCodeAt(str2Pos + 6) - 48
                     }else 
                     {
                        field8Data = 99;
                     }
                }else
                {
                    field8Data = 99;
                }
               
                basic.pause(100)
            }
        }
        if(field8Data === 1)
        {
            actuatorActivated = true
        }else
        {
            actuatorActivated = false
        }
        return actuatorActivated
    }
    
    
     /**
    * return string from esp8266 - for debugging
    */
    /*
    //% subcategory=IoT
    //% block="respond string"
    export function respondString():string {
        return field7_str
    }
    */
    
     /**
    * reset esp8266
    */
    //% subcategory=IoT
    //% block="reset ESP %resetPin"
    //% resetPin.defl=DigitalPin.P15
    export function resetESP(resetPin: DigitalPin) {
        pins.digitalWritePin(resetPin, 0)
        basic.pause(10)
        pins.digitalWritePin(resetPin, 1)
        basic.pause(300)
    }
    
    /**
    * Pause between uploads
    */
    //% subcategory=IoT
    //% block="pause %delay ms"
    //% delay.min=0 delay.defl=20000
    export function wait(delay: number) {
        if (delay > 0) basic.pause(delay)
    }
    
    
     /**
    * Check if ESP8266 successfully connected to Wifi
    */
    //% subcategory=IoT
    //% block="wifi connected?"
    export function isWifiConnected() {
        return wifi_connected
    }

    /**
    * Check if ESP8266 successfully connected to ThingSpeak
    */
    //% subcategory=IoT
    //% block="ThingSpeak connected?"
    export function isThingSpeakConnected() {
        return thingspeak_connected
    }

    /**
    * Check if ESP8266 successfully uploaded data to ThingSpeak
    */
    //% subcategory=IoT
    //% block="last data upload successful?"
    export function isLastUploadSuccessful() {
        return last_upload_successful
    }
    
   
}  //namespace SGBotic