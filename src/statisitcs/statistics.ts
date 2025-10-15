
// loginfo == timestamp, method, url, status, req, res
// 4123412, GET, http.../reserve, 201, { }, { }
// map statisticsMappin: Map<day, loginfo>

export type LogInfo ={
    timestamp: number;
    method:    string;
    url:       string;
    status:    number;
    req:       string;
    res:       unknown;
}

const statisticsMap = new Map<string, LogInfo[]>();

function timeStampKey(timestamp = Date.now()):string{
    return new Date(timestamp).toISOString().slice(0,10); //1.234.567.890
}

export function writeLogInfo(entry: LogInfo): void{
    const tsKey = timeStampKey(entry.timestamp);
    if (!statisticsMap.has(tsKey)){
        statisticsMap.set(tsKey, []);
    }
    const log = statisticsMap.get(tsKey)!;
    log.push(entry);
    deleteOldLogs(); 
}

function deleteOldLogs(): void{
    const MaxDaysToSave = 31;
    if (statisticsMap.size <= MaxDaysToSave) return;
    const keys = [...statisticsMap.keys()].sort();
    while (keys.length > MaxDaysToSave){
        const forDelete = keys.shift()!;
        statisticsMap.delete(forDelete);
    }
}

export function getStatistics(period: number): LogInfo[]{
    const currentTime = Date.now();
    const resLogInfo: LogInfo[] = [];
    for(let i = 0; i < period; i++){
        const date = new Date(currentTime);
        date.setUTCDate(date.getUTCDate()-i);
        const key = date.toISOString().slice(0,10);
        const log = statisticsMap.get(key);
        if(log){
            resLogInfo.push(...log);
        }
    }
    return resLogInfo;
}