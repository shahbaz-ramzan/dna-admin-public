// interfaces.ts

export interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

export interface WonderChatRequest {
    chatbotId: string
    question: string
    chatlogId?: string
    context?: string
    contextUrl?: string
}

export interface WonderChatResponse {
    response: string
    chatlogId: string
    sources: {
        url: string
        title: string
    }[]
}

export interface MainUsersState {
    loading: boolean
    workRelatedMoneyInsights: {
        message: string
    }
    tScorePaylaod?: {
        data?: {
            tscore: number[]
        }
    }
}

export interface AppState {
    mainUsers: MainUsersState
    mainUserReducer: any
}
