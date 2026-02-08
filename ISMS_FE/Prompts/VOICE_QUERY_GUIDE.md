# Voice Query Feature - User Guide

## Tổng quan

Voice Query là tính năng cho phép người dùng truy vấn database bằng giọng nói tiếng Việt, tự động chuyển đổi thành SQL và hiển thị kết quả.

## Luồng xử lý

```
User Voice → Whisper API (Speech-to-Text) → Text-to-SQL API → SQL Execution → Results Display
```

### Chi tiết từng bước:

1. **Ghi âm (Recording)**
   - User click "Start Recording"
   - Browser yêu cầu quyền microphone
   - Ghi âm audio dạng `audio/webm;codecs=opus`
   - Hiển thị timer thời gian ghi âm

2. **Transcription (Whisper API)**
   - Endpoint: `POST /api/whisper/transcribe`
   - Format: `multipart/form-data`
   - Request:
     ```
     FormData: {
       file: audioBlob (recording.webm)
     }
     ```
   - Response:
     ```json
     {
       "success": true,
       "data": {
         "text": "Có bao nhiêu sản phẩm?",
         "language": "vi",
         "duration": 2.5
       },
       "fileName": "recording.webm",
       "fileSize": 12345
     }
     ```

3. **Text-to-SQL Conversion**
   - Endpoint: `POST /api/text-to-sql/query`
   - Format: `application/json`
   - Request:
     ```json
     {
       "naturalLanguage": "Có bao nhiêu sản phẩm?"
     }
     ```

## Response Formats

### Single Query Response

Khi câu hỏi chỉ cần 1 query SQL:

```json
{
  "isSuccess": true,
  "responseCode": "success",
  "message": "200",
  "data": {
    "sql": "SELECT COUNT(*) AS Total FROM Product",
    "result": [
      { "Total": 30 }
    ]
  }
}
```

**UI Display:**
- Transcript (blue box): "Có bao nhiêu sản phẩm?"
- SQL Query (green box): `SELECT COUNT(*) AS Total FROM Product`
- Results (violet box): JSON formatted results (1 row)

### Multiple Queries Response

Khi câu hỏi cần query từ nhiều bảng (ví dụ: "Tìm toàn bộ thông tin iPad"):

```json
{
  "isSuccess": true,
  "message": "Executed 3 queries successfully",
  "data": {
    "sql": "SELECT ... FROM Product WHERE ... ||| SELECT ... FROM Inventory WHERE ... ||| SELECT ... FROM InventoryHistory WHERE ...",
    "result": {
      "queries": [
        "SELECT ... FROM Product WHERE ...",
        "SELECT ... FROM Inventory WHERE ...",
        "SELECT ... FROM InventoryHistory WHERE ..."
      ],
      "totalQueries": 3,
      "results": [
        {
          "query": "SELECT ... FROM Product WHERE ...",
          "data": [...],
          "rowCount": 5,
          "tableName": "Product"
        },
        {
          "query": "SELECT ... FROM Inventory WHERE ...",
          "data": [...],
          "rowCount": 5,
          "tableName": "Inventory"
        },
        {
          "query": "SELECT ... FROM InventoryHistory WHERE ...",
          "data": [...],
          "rowCount": 12,
          "tableName": "InventoryHistory"
        }
      ]
    }
  }
}
```

**UI Display:**
- Transcript (blue box): "Tìm toàn bộ thông tin iPad"
- SQL Query (green box): Combined SQL separated by ` ||| `
- Info Banner (blue): "Multiple Tables Found: 3 result sets"
- For each result:
  - Card header: Table name + row count
  - SQL query (gray box)
  - Data results (violet box) - JSON formatted

## Frontend Implementation

### Service Layer (`voiceQueryService.ts`)

```typescript
class VoiceQueryService {
  // Upload audio → transcription
  async transcribeAudio(audioBlob: Blob): Promise<{
    text: string
    language?: string
    duration?: number
  }>

  // Natural language → SQL + Execute
  async convertToSQL(naturalLanguage: string): Promise<{
    sql: string
    isSingleQuery: boolean
    singleResult?: any[]
    multipleResults?: MultipleQueryResult[]
    totalQueries?: number
    fullResponse: TextToSQLResponse
  }>

  // Full pipeline
  async processVoiceQuery(audioBlob: Blob): Promise<{
    transcript: string
    sqlQuery: string
    isSingleQuery: boolean
    singleResult?: any[]
    multipleResults?: MultipleQueryResult[]
    ...
  }>
}
```

### State Management

```typescript
const [transcript, setTranscript] = useState('')
const [sqlQuery, setSqlQuery] = useState('')
const [isSingleQuery, setIsSingleQuery] = useState(true)
const [singleResult, setSingleResult] = useState<any[] | null>(null)
const [multipleResults, setMultipleResults] = useState<MultipleQueryResult[] | null>(null)
```

### Detection Logic

```typescript
// Check SQL format to determine single vs multiple
const isSingleQuery = !sql.includes('|||')

if (isSingleQuery) {
  // Display single result
  setSingleResult(data?.data?.result || [])
} else {
  // Display multiple results
  setMultipleResults(data?.data?.result?.results || [])
}
```

## Example Queries

### Single Query Examples

1. **Đếm số lượng**
   - Voice: "Có bao nhiêu sản phẩm?"
   - SQL: `SELECT COUNT(*) AS Total FROM Product`
   - Result: `[{ "Total": 30 }]`

2. **Lọc theo điều kiện**
   - Voice: "Sản phẩm nào có giá trên 20 triệu?"
   - SQL: `SELECT * FROM Product WHERE Price > 20000000`
   - Result: Array of products

3. **Thống kê**
   - Voice: "Tổng giá trị tồn kho là bao nhiêu?"
   - SQL: `SELECT SUM(Price * Quantity) AS Total FROM Inventory i JOIN Product p ON ...`
   - Result: `[{ "Total": 1500000000 }]`

### Multiple Queries Examples

1. **Tìm kiếm tổng hợp**
   - Voice: "Tìm tất cả thông tin về iPhone"
   - Queries:
     ```sql
     SELECT * FROM Product WHERE Name LIKE '%iPhone%'
     |||
     SELECT * FROM Inventory WHERE ProductId IN (...)
     |||
     SELECT * FROM InventoryHistory WHERE ProductId IN (...)
     ```
   - Results: 3 result sets (Product, Inventory, InventoryHistory)

2. **Báo cáo phức tạp**
   - Voice: "Báo cáo tổng quan kho hàng hôm nay"
   - Multiple queries for different aspects
   - Multiple result sets

## UI Components

### Recording Section (Left Column)

- **Recording Controls**
  - Start/Stop button with animation
  - Real-time timer (MM:SS)
  - Recording indicator (pulsing red dot)

- **Audio Preview**
  - HTML5 audio player
  - Duration display
  - Process/Reset buttons

### Results Section (Right Column)

- **Transcription Display** (Blue box)
  - Icon: Volume2
  - Show transcribed text with quotes

- **SQL Query Display** (Green box)
  - Icon: Database
  - Monospace font for SQL
  - Scrollable for long queries

- **Results Display**
  - **Single Query** (Violet box):
    - Row count in header
    - JSON formatted data
    - Max height with scroll

  - **Multiple Queries** (Multiple violet boxes):
    - Info banner showing total queries
    - Each result in separate card:
      - Table name + row count
      - SQL query (gray box)
      - Data (violet box)
      - Error message if query failed

## Error Handling

### Frontend Errors

1. **No microphone permission**
   ```
   Toast: "Microphone access denied"
   → User must allow in browser settings
   ```

2. **No audio recorded**
   ```
   Toast: "Please record audio first"
   → User needs to record before processing
   ```

3. **Network errors**
   ```
   Toast: "Failed to process voice query"
   → Check backend connection
   ```

### Backend Errors

1. **Whisper API errors** (503)
   - Whisper backend unreachable
   - Display error message from response

2. **Text-to-SQL errors** (500)
   - Gemini API timeout
   - SQL generation failed
   - SQL execution error

3. **Validation errors** (400)
   - Empty input
   - Invalid file format
   - Dangerous SQL keywords (DROP, DELETE, UPDATE)

## Performance Considerations

1. **Audio Recording**
   - Format: audio/webm (smaller file size)
   - Browser native MediaRecorder API
   - No external dependencies

2. **API Timeouts**
   - Whisper: ~2-10 seconds (depends on audio length)
   - Gemini: up to 5 minutes (for complex queries)
   - Multiple queries execute sequentially

3. **Results Limit**
   - Each query limited to TOP 20-50 rows
   - Prevents overwhelming UI
   - Large datasets show sample

## Security

1. **SQL Injection Protection**
   - Backend validates all SQL
   - Only SELECT queries allowed
   - Dangerous keywords blocked:
     - DROP, DELETE, UPDATE, INSERT
     - ALTER, TRUNCATE, EXEC

2. **Authentication**
   - JWT token in Authorization header
   - Auto-added by apiClient interceptor
   - 401 → Redirect to login

## Testing Guide

### Manual Testing

1. **Record a simple query**
   ```
   Voice: "Có bao nhiêu đơn nhập hàng?"
   Expected: Single result with count
   ```

2. **Record a complex query**
   ```
   Voice: "Tìm toàn bộ thông tin về laptop Dell"
   Expected: Multiple result sets from different tables
   ```

3. **Test error cases**
   - Deny microphone permission
   - Click Process without recording
   - Speak unclear/ambiguous query

### API Testing (using .http file)

See: `text-to-sql-flow.http` in backend

```http
### Test single query
POST http://localhost:8080/api/text-to-sql/query
Content-Type: application/json

{
  "naturalLanguage": "Có bao nhiêu sản phẩm?"
}

### Test multiple queries
POST http://localhost:8080/api/text-to-sql/query
Content-Type: application/json

{
  "naturalLanguage": "Tìm tất cả thông tin về iPhone"
}
```

## Future Improvements

1. **Combined Endpoint** (`/api/whisper/transcribe-and-query`)
   - Single API call for full pipeline
   - Reduces frontend complexity
   - Better error handling

2. **Query History**
   - Save past voice queries
   - Quick re-execute
   - Export results

3. **Audio Quality**
   - Support multiple audio formats (.wav, .mp3)
   - Audio quality selector
   - Noise reduction

4. **Results Export**
   - Download as CSV/Excel
   - Copy to clipboard
   - Share results

5. **Voice Commands**
   - "Show more results"
   - "Export to Excel"
   - "Go to next page"

## Troubleshooting

### Audio not recording
- Check microphone permissions in browser
- Try different browser (Chrome/Edge recommended)
- Check microphone hardware

### Transcription empty
- Speak louder and clearer
- Avoid background noise
- Check audio file is not silent

### No results returned
- Check backend logs for SQL errors
- Verify database connection
- Check query permissions

### Multiple results not showing
- Check SQL contains `|||` separator
- Verify response format matches expected structure
- Check console for errors

## API Reference

### Whisper Transcribe
```
POST /api/whisper/transcribe
Content-Type: multipart/form-data

Field: file (audio/webm, audio/wav, etc.)

Response: {
  success: boolean
  data: {
    text: string
    language: string
    duration: number
  }
}
```

### Text-to-SQL Query
```
POST /api/text-to-sql/query
Content-Type: application/json

Body: {
  naturalLanguage: string
}

Response (Single): {
  isSuccess: boolean
  data: {
    sql: string
    result: any[]
  }
}

Response (Multiple): {
  isSuccess: boolean
  data: {
    sql: string (with |||)
    result: {
      queries: string[]
      totalQueries: number
      results: [
        {
          query: string
          data: any[]
          rowCount: number
          tableName: string
          error?: string
        }
      ]
    }
  }
}
```

---

**Last Updated:** November 2, 2025  
**Version:** 1.0.0  
**Author:** Development Team
