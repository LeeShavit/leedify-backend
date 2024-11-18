import { DB_KEY } from "../services/credentials"

export default {
  dbURL: `mongodb+srv://leedor:${DB_KEY}@leedify.0sqjx.mongodb.net/?retryWrites=true&w=majority&appName=leedify`,
  dbName: 'leedify_db',
}
