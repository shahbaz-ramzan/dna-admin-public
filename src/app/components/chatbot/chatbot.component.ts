import { CommonModule } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import {
    AfterViewChecked,
    ChangeDetectorRef,
    Component,
    ElementRef,
    HostListener,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    SimpleChanges,
    ViewChild,
} from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Store } from '@ngrx/store'
import { MarkdownModule } from 'ngx-markdown'
import { Observable, Subject } from 'rxjs'
import { map, takeUntil } from 'rxjs/operators'
import { MixpanelService } from 'src/app/service/mixpanel.service'
import { MsgService } from 'src/app/service/msg.service'
import Encryption from 'src/app/util/Encryption'
import { AppState, ChatMessage, WonderChatRequest, WonderChatResponse } from './chatbot.interfaces'

@Component({
    selector: 'app-chatbot',
    templateUrl: './chatbot.component.html',
    standalone: true,
    imports: [CommonModule, FormsModule, MarkdownModule],
    styleUrls: ['./chatbot.component.css'],
})
export class ChatbotComponent implements OnInit, AfterViewChecked, OnDestroy, OnChanges {
    @ViewChild('messageInput') messageInput!: ElementRef<HTMLTextAreaElement>
    @ViewChild('messagesContainer') messagesContainer!: ElementRef<HTMLDivElement>
    @Input() chat_payload_data: any
    @Input() isDownloadReady: boolean = false
    @Input() chatbotId: string = 'cmawxvc970d3j12y77gb78xnw' // Default ID for single user reports
    messages: ChatMessage[] = []
    newMessage: string = ''
    isMinimized: boolean = false
    isLoading$: Observable<boolean>
    shouldScrollToBottom: boolean = false
    isFocused: boolean = false
    copiedMessageId: number | null = null
    hasInitialized: boolean = false
    feedbackStatus: 'GOOD' | 'BAD' | null = null
    isClearingChat: boolean = false
    isDesktopView = window.innerWidth >= 1280
    primaryColor: any = '#2e9b64'
    // New properties for scroll behavior
    isUserScrolling: boolean = false
    isAtBottom: boolean = true
    showScrollToBottom: boolean = false
    scrollTimeout: any = null
    lastScrollTop: number = 0

    private isProcessing: boolean = false
    private readonly API_URL = 'https://app.wonderchat.io/api/v1/chat'
    // private readonly FEEDBACK_API_URL = '/api/api/v1/update-chat-feedback'
    private chatlogId: string | null = null
    private hasInitialApiCall: boolean = false
    private initialApiResponse: WonderChatResponse | null = null
    private loadingMessage: ChatMessage | null = null
    private typewriterText: string = ''
    private typewriterSpeed: number = 7 // milliseconds per character
    private typewriterInterval: any = null

    private destroy$ = new Subject<void>()

    constructor(
        private store: Store<AppState>,
        private cdr: ChangeDetectorRef,
        private http: HttpClient,
        private msgService: MsgService,
        private mixpanelService: MixpanelService
    ) {
        this.isLoading$ = this.store.select((state) => state?.mainUsers?.loading || false).pipe(map((loading) => loading))
        this.primaryColor = localStorage.getItem('primaryColor')
        document.documentElement.style.setProperty(`--primary-color`, this.primaryColor)
    }

    ngOnInit(): void {
        // Initialize chatbot state based on isDownloadReady
        if (!this.isDownloadReady) {
            this.isMinimized = true
        }

        this.setupMoneyInsightsSubscription()
    }

    ngOnChanges(changes: SimpleChanges): void {
        const isDownloadReadyChange = changes['isDownloadReady']
        const chatPayloadDataChange = changes['chat_payload_data']
        if (isDownloadReadyChange && !isDownloadReadyChange.firstChange) {
            const currentValue = isDownloadReadyChange.currentValue
            const previousValue = isDownloadReadyChange.previousValue

            // Handle chatbot visibility
            if (currentValue && !previousValue) {
                this.isMinimized = false
                this.restoreFocus()
                // Initialize scroll state when chatbot becomes available
                setTimeout(() => {
                    this.checkIfAtBottom()
                }, 100)
            } else if (!currentValue && previousValue) {
                this.isMinimized = true
            }
        }

        if (chatPayloadDataChange && chatPayloadDataChange.currentValue) {
            // Update the chat_payload_data with the new value
            this.chat_payload_data = chatPayloadDataChange.currentValue

            // Add a small delay to ensure data is fully processed
            setTimeout(() => {
                this.dispatchInitialPayload()
            }, 100)
        }
    }

    ngAfterViewChecked(): void {
        if (this.shouldScrollToBottom) {
            this.conditionalScrollToBottom()
            this.shouldScrollToBottom = false
        }
    }

    ngOnDestroy(): void {
        if (this.typewriterInterval) {
            clearInterval(this.typewriterInterval)
        }
        if (this.scrollTimeout) {
            clearTimeout(this.scrollTimeout)
        }
        this.destroy$.next()
        this.destroy$.complete()
    }

    private setupMoneyInsightsSubscription(): void {
        this.store
            .select((state) => state?.mainUsers?.workRelatedMoneyInsights)
            .pipe(takeUntil(this.destroy$))
            .subscribe((insights) => {
                if (insights?.message) {
                    this.messages.push({
                        role: 'assistant',
                        content: insights.message,
                        timestamp: new Date(),
                    })
                    this.shouldScrollToBottom = true
                    this.hasInitialized = true
                    this.cdr.detectChanges()
                }
            })
    }

    private dispatchInitialPayload(): void {
        // Prevent multiple initial API calls
        if (this.hasInitialApiCall || this.isProcessing) {
            return
        }

        // Check if we have valid chat payload data before proceeding
        if (!this.chat_payload_data || Object.keys(this.chat_payload_data).length === 0) {
            console.log('Chat payload data is empty, skipping API call')
            return
        }

        // Check if tScores are populated (not all zeros)
        const tScores = this.chat_payload_data.tScores
        if (tScores && typeof tScores === 'object') {
            const scoreValues = Object.values(tScores) as number[]
            const hasValidScores = scoreValues.some((score) => score && score !== 0)
            if (!hasValidScores) {
                // Reset flag to allow retry
                this.hasInitialApiCall = false
                this.isProcessing = false
                return
            }
        }
        // Set initial state
        this.hasInitialApiCall = true
        this.isProcessing = true

        // Add loading message
        this.loadingMessage = {
            role: 'assistant',
            content: '',
            timestamp: new Date(),
        }
        this.messages.push(this.loadingMessage)
        this.shouldScrollToBottom = true
        this.isAtBottom = true // Ensure we're considered at bottom for initial message
        this.cdr.detectChanges()

        const initialPayload: WonderChatRequest = {
            chatbotId: this.chatbotId,
            question: JSON.stringify(this.chat_payload_data),
            context: 'You are a DNA Behavior Assistant analyzing user behavior patterns and providing insights.',
        }

        this.http
            .post<WonderChatResponse>(this.API_URL, initialPayload)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    this.initialApiResponse = response
                    this.chatlogId = response.chatlogId

                    // Replace loading message with actual response
                    if (this.loadingMessage) {
                        const index = this.messages.indexOf(this.loadingMessage)
                        if (index !== -1) {
                            this.messages[index] = {
                                role: 'assistant',
                                content: '',
                                timestamp: new Date(),
                            }
                            this.startTypewriterEffect(response.response, index)
                        }
                    }

                    this.shouldScrollToBottom = true
                    this.hasInitialized = true
                    this.cdr.detectChanges()
                    // Check scroll state after initial response
                    setTimeout(() => {
                        this.checkIfAtBottom()
                    }, 100)
                },
                error: (error) => {
                    console.error('Error sending initial message:', error)
                    this.hasInitialApiCall = false
                    // Remove loading message on error
                    if (this.loadingMessage) {
                        const index = this.messages.indexOf(this.loadingMessage)
                        if (index !== -1) {
                            this.messages.splice(index, 1)
                        }
                    }

                    this.messages.push({
                        role: 'assistant',
                        content: '⚠️ Something went wrong. Please try again.',
                        timestamp: new Date(),
                    })
                },
                complete: () => {
                    this.isProcessing = false
                    this.loadingMessage = null
                    this.cdr.detectChanges()
                },
            })
    }
    @HostListener('window:resize', [])
    onResize() {
        this.updateViewMode()
    }

    private updateViewMode() {
        this.isDesktopView = window.innerWidth >= 1280
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        const chatbotWrapper = document.getElementById('chatbot-wrapper')
        if (chatbotWrapper && !chatbotWrapper.contains(event.target as Node)) {
            this.isFocused = false
        }
    }

    onTextareaFocus(): void {
        this.isFocused = true
    }

    scrollToBottom(): void {
        try {
            const container = this.messagesContainer.nativeElement
            container.scrollTop = container.scrollHeight
        } catch (err) {
            // console.error('Error scrolling to bottom:', err)
        }
    }

    // New method for conditional scrolling
    conditionalScrollToBottom(): void {
        if (this.isAtBottom && !this.isUserScrolling) {
            this.scrollToBottom()
        }
    }

    // Method to scroll to bottom when user clicks the button
    forceScrollToBottom(): void {
        this.scrollToBottom()
        this.showScrollToBottom = false
        this.isAtBottom = true
    }

    // Method to detect if user is at bottom of chat
    checkIfAtBottom(): void {
        try {
            const container = this.messagesContainer.nativeElement
            const threshold = 50 // pixels from bottom to consider "at bottom"
            const atBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - threshold

            this.isAtBottom = atBottom
            this.showScrollToBottom = !atBottom && this.messages.length > 5
            this.cdr.detectChanges()
        } catch (err) {
            // console.error('Error checking scroll position:', err)
        }
    }

    // Handle scroll events from the messages container
    onMessagesScroll(event: Event): void {
        const target = event.target as HTMLElement
        const currentScrollTop = target.scrollTop

        // Detect if user is actively scrolling
        this.isUserScrolling = Math.abs(currentScrollTop - this.lastScrollTop) > 5
        this.lastScrollTop = currentScrollTop

        // Clear existing timeout
        if (this.scrollTimeout) {
            clearTimeout(this.scrollTimeout)
        }

        // Set timeout to detect when scrolling stops
        this.scrollTimeout = setTimeout(() => {
            this.isUserScrolling = false
        }, 150)

        this.checkIfAtBottom()
    }

    handleKeydown(event: KeyboardEvent): void {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            this.sendMessage()
        }
    }

    adjustTextareaHeight(): void {
        const textarea = this.messageInput.nativeElement
        textarea.style.height = 'auto'
        textarea.style.height = `${textarea.scrollHeight}px`
    }

    private restoreFocus(): void {
        if (this.isFocused && this.messageInput) {
            requestAnimationFrame(() => {
                this.messageInput.nativeElement.focus()
                this.cdr.detectChanges()
            })
        }
    }

    private startTypewriterEffect(text: string, messageIndex: number): void {
        this.typewriterText = ''
        let currentIndex = 0

        if (this.typewriterInterval) {
            clearInterval(this.typewriterInterval)
        }

        this.typewriterInterval = setInterval(() => {
            if (currentIndex < text.length) {
                this.typewriterText += text[currentIndex]
                this.messages[messageIndex].content = this.typewriterText

                // Only trigger scroll if user is at bottom and not actively scrolling
                if (this.isAtBottom && !this.isUserScrolling) {
                    this.shouldScrollToBottom = true
                }
                this.cdr.detectChanges()
                currentIndex++
            } else {
                clearInterval(this.typewriterInterval)
                this.typewriterInterval = null

                // Ensure we scroll to bottom when typewriter completes, if user is still at bottom
                if (this.isAtBottom) {
                    this.shouldScrollToBottom = true
                    this.cdr.detectChanges()
                }
            }
        }, this.typewriterSpeed)
    }

    async sendMessage(): Promise<void> {
        const messageText = this.newMessage.trim()
        if (!messageText || this.isProcessing) return

        this.isProcessing = true
        const userMessage: ChatMessage = {
            role: 'user',
            content: messageText,
            timestamp: new Date(),
        }

        // Add user message
        this.messages.push(userMessage)
        this.newMessage = ''

        // If user is at bottom, enable auto-scroll for the new messages
        const wasAtBottom = this.isAtBottom
        if (wasAtBottom) {
            this.shouldScrollToBottom = true
        }

        // Add loading message
        this.loadingMessage = {
            role: 'assistant',
            content: '',
            timestamp: new Date(),
        }
        this.messages.push(this.loadingMessage)
        if (wasAtBottom) {
            this.shouldScrollToBottom = true
        }
        this.cdr.detectChanges()

        if (this.messageInput) {
            this.messageInput.nativeElement.style.height = 'auto'
        }

        const payload: WonderChatRequest = {
            chatbotId: this.chatbotId,
            question: messageText,
            chatlogId: this.chatlogId || undefined,
            context: 'You are a DNA Behavior Assistant analyzing user behavior patterns and providing insights.',
        }

        try {
            const response = await this.http.post<WonderChatResponse>(this.API_URL, payload).pipe(takeUntil(this.destroy$)).toPromise()

            if (response) {
                this.chatlogId = response.chatlogId
                // Replace loading message with actual response
                if (this.loadingMessage) {
                    const index = this.messages.indexOf(this.loadingMessage)
                    if (index !== -1) {
                        this.messages[index] = {
                            role: 'assistant',
                            content: '',
                            timestamp: new Date(),
                        }
                        this.startTypewriterEffect(response.response, index)
                    }
                }
                this.cdr.detectChanges()
            }
        } catch (error) {
            console.error('Error sending message:', error)
            // Remove loading message on error
            if (this.loadingMessage) {
                const index = this.messages.indexOf(this.loadingMessage)
                if (index !== -1) {
                    this.messages.splice(index, 1)
                }
            }
        } finally {
            this.isProcessing = false
            this.loadingMessage = null
            this.cdr.detectChanges()
        }

        this.restoreFocus()
    }

    toggleMinimize(): void {
        // Prevent toggling when download is not ready
        if (!this.isDownloadReady) {
            return
        }
        this.isMinimized = !this.isMinimized
        if (!this.isMinimized) {
            this.restoreFocus()
        }
    }

    async copyToClipboard(text: string, messageIndex: number): Promise<void> {
        try {
            await navigator.clipboard.writeText(text)
            this.copiedMessageId = messageIndex
            setTimeout(() => {
                this.copiedMessageId = null
                this.cdr.detectChanges()
            }, 2000)
        } catch (err) {
            console.error('Failed to copy text: ', err)
        }
    }

    // For better ngFor performance
    trackByIndex(index: number): number {
        return index
    }

    async giveFeedback(isPositive: boolean): Promise<void> {
        const accountID = localStorage.getItem('accountId')
        if (!this.chatlogId) return

        try {
            const feedback = isPositive ? 'GOOD' : 'BAD'
            const encryptedAccountID = accountID ? Encryption.encryptData(accountID) : ''
            // const payload = {
            //     apiKey: '<API_KEY>',
            //     chatlogId: this.chatlogId,
            //     feedback: feedback,
            // }

            // const headers = {
            //     'Content-Type': 'application/json',
            //     Accept: 'application/json',
            //     Origin: window.location.origin,
            // }
            // const response = await this.http.post(this.FEEDBACK_API_URL, payload, { headers }).toPromise()

            // Track feedback event in Mixpanel

            this.mixpanelService.track('Wonderchat Feedback', {
                chatlogId: this.chatlogId,
                feedback,
                accountId: encryptedAccountID,
                timestamp: new Date().toISOString(),
            })

            this.feedbackStatus = feedback
            this.cdr.detectChanges()
        } catch (error) {
            console.error('Error giving feedback:', error)
        }
    }
}
