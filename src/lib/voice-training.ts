import { openai, getCurrentContext } from '@/lib/openai';
import { VoiceProfile } from '@/lib/types';

export class VoiceTrainer {
  /**
   * Analyzes writing samples or quiz answers to extract voice characteristics
   */
  async analyzeWritingSamples(samples: string[]): Promise<Partial<VoiceProfile>> {
    // Check if this is quiz-based data
    if (samples.length === 1 && samples[0].startsWith('Generated from personality quiz:')) {
      return this.processQuizAnswers(samples[0]);
    }
    const { contextPrompt } = getCurrentContext();
    
    const analysisPrompt = `
      ${contextPrompt}
      
      Analyze the following writing samples and extract the author's voice characteristics.
      
      Writing Samples:
      ${samples.map((sample, i) => `Sample ${i + 1}:\n${sample}\n`).join('\n')}
      
      Please analyze and provide a JSON response with the following structure:
      {
        "toneAttributes": {
          "professional": 0.0-1.0,
          "casual": 0.0-1.0,
          "humorous": 0.0-1.0,
          "inspirational": 0.0-1.0,
          "educational": 0.0-1.0
        },
        "vocabularyPreferences": {
          "use": ["commonly used words/phrases"],
          "avoid": ["words/phrases to avoid"]
        },
        "sentenceStructure": {
          "averageLength": number,
          "complexity": "simple|medium|complex",
          "paragraphLength": number
        },
        "emojiUsage": {
          "frequency": "none|low|medium|high",
          "preferred": ["preferred emojis if any"]
        },
        "hashtagStyle": {
          "count": number,
          "placement": "inline|end|both",
          "format": "lowercase|camelCase|mixed"
        },
        "keyMessages": ["main themes/topics the author discusses"],
        "brandPersonality": {
          "traits": ["key personality traits"],
          "values": ["core values expressed"],
          "expertise": ["areas of expertise"]
        }
      }
      
      Base your analysis on:
      - Tone: Professional vs casual language, humor level, inspirational elements
      - Vocabulary: Common words, industry jargon, complexity level
      - Structure: Sentence length, paragraph organization, complexity
      - Formatting: Emoji usage patterns, hashtag style and placement
      - Content: Key themes, expertise areas, personality traits
      
      Respond with ONLY the JSON object, no additional text.
    `;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert writing style analyst. Analyze writing samples and extract voice characteristics in the exact JSON format requested.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent analysis
        max_tokens: 1500,
      });

      const analysisText = response.choices[0]?.message?.content;
      if (!analysisText) {
        throw new Error('No analysis received from OpenAI');
      }

      // Parse the JSON response
      const analysis = JSON.parse(analysisText);
      
      return {
        toneAttributes: analysis.toneAttributes,
        vocabularyPreferences: analysis.vocabularyPreferences,
        sentenceStructure: analysis.sentenceStructure,
        emojiUsage: analysis.emojiUsage,
        hashtagStyle: analysis.hashtagStyle,
        keyMessages: analysis.keyMessages || [],
        brandPersonality: analysis.brandPersonality,
        trainingVersion: 1,
      };
    } catch (error) {
      console.error('Voice analysis error:', error);
      // Return default values if analysis fails
      return {
        toneAttributes: {
          professional: 0.7,
          casual: 0.3,
          humorous: 0.1,
          inspirational: 0.2,
          educational: 0.5,
        },
        vocabularyPreferences: {
          use: [],
          avoid: [],
        },
        sentenceStructure: {
          averageLength: 15,
          complexity: 'medium',
          paragraphLength: 3,
        },
        emojiUsage: {
          frequency: 'low',
          preferred: [],
        },
        hashtagStyle: {
          count: 3,
          placement: 'end',
          format: 'camelCase',
        },
        keyMessages: [],
        brandPersonality: {},
        trainingVersion: 1,
      };
    }
  }

  /**
   * Generates content using the user's voice profile
   */
  async generateContent(
    prompt: string,
    voiceProfile: VoiceProfile,
    contentType: 'post' | 'article' | 'comment' = 'post',
    platform: 'linkedin' | 'twitter' = 'linkedin'
  ): Promise<{ content: string; confidence: number }> {
    const { contextPrompt } = getCurrentContext();
    
    const voicePrompt = this.buildVoicePrompt(voiceProfile, contentType, platform);
    
    const generationPrompt = `
      ${contextPrompt}
      
      ${voicePrompt}
      
      Topic/Instruction: ${prompt}
      
      Generate a ${contentType} for ${platform} that matches the voice profile exactly. 
      
      Requirements:
      - Write in July 2025 (current date context)
      - Sound authentic to the voice profile
      - Include relevant hashtags if appropriate for the voice style
      - Keep within platform limits (LinkedIn: 3000 chars, Twitter: 280 chars)
      - Make it engaging and valuable to the target audience
      
      Respond with ONLY the content, no additional formatting or explanation.
    `;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert content creator who writes in the exact voice and style of the provided voice profile. You are writing in July 2025.'
          },
          {
            role: 'user',
            content: generationPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: platform === 'twitter' ? 100 : 800,
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) {
        throw new Error('No content generated');
      }

      // Calculate confidence score based on voice profile match
      const confidence = this.calculateConfidenceScore(content, voiceProfile);

      return {
        content,
        confidence
      };
    } catch (error) {
      console.error('Content generation error:', error);
      throw new Error('Failed to generate content');
    }
  }

  /**
   * Builds a detailed voice prompt from the voice profile
   */
  private buildVoicePrompt(
    voiceProfile: VoiceProfile,
    contentType: string,
    platform: string
  ): string {
    // Provide default values if voice profile data is missing
    const defaultToneAttributes = {
      professional: 0.5,
      casual: 0.3,
      humorous: 0.1,
      inspirational: 0.1,
      educational: 0.5
    };
    
    const defaultVocabularyPreferences = {
      use: [],
      avoid: []
    };
    
    const defaultSentenceStructure = {
      averageLength: 15,
      complexity: 'medium',
      paragraphLength: 3
    };
    
    const defaultEmojiUsage = {
      frequency: 'low',
      preferred: []
    };
    
    const defaultHashtagStyle = {
      count: 3,
      placement: 'end',
      format: 'camelCase'
    };

    const {
      toneAttributes = defaultToneAttributes,
      vocabularyPreferences = defaultVocabularyPreferences,
      sentenceStructure = defaultSentenceStructure,
      emojiUsage = defaultEmojiUsage,
      hashtagStyle = defaultHashtagStyle,
      keyMessages = [],
      brandPersonality = {}
    } = voiceProfile;

    return `
      Voice Profile Guidelines:
      
      TONE (match these percentages):
      - Professional: ${Math.round((toneAttributes?.professional || 0.5) * 100)}%
      - Casual: ${Math.round((toneAttributes?.casual || 0.3) * 100)}%
      - Humorous: ${Math.round((toneAttributes?.humorous || 0.1) * 100)}%
      - Inspirational: ${Math.round((toneAttributes?.inspirational || 0.1) * 100)}%
      - Educational: ${Math.round((toneAttributes?.educational || 0.5) * 100)}%
      
      VOCABULARY:
      - Preferred words/phrases: ${vocabularyPreferences?.use?.join(', ') || 'None specified'}
      - Words to avoid: ${vocabularyPreferences?.avoid?.join(', ') || 'None specified'}
      
      SENTENCE STRUCTURE:
      - Average sentence length: ${sentenceStructure?.averageLength || 15} words
      - Complexity: ${sentenceStructure?.complexity || 'medium'}
      - Paragraph length: ${sentenceStructure?.paragraphLength || 3} sentences
      
      EMOJI USAGE:
      - Frequency: ${emojiUsage?.frequency || 'low'}
      - Preferred emojis: ${emojiUsage?.preferred?.join(' ') || 'None'}
      
      HASHTAG STYLE:
      - Count: ${hashtagStyle?.count || 3}
      - Placement: ${hashtagStyle?.placement || 'end'}
      - Format: ${hashtagStyle?.format || 'camelCase'}
      
      KEY MESSAGES/THEMES:
      ${keyMessages && keyMessages.length > 0 ? keyMessages.map(msg => `- ${msg}`).join('\n') : '- Focus on professional expertise and insights'}
      
      BRAND PERSONALITY:
      ${brandPersonality && Object.keys(brandPersonality).length > 0 ? Object.entries(brandPersonality).map(([key, value]) => 
        `${key}: ${Array.isArray(value) ? value.join(', ') : value}`
      ).join('\n') : 'Professional and authentic'}
      
      Write ${contentType} content that exactly matches this voice profile. 
      Make it sound like this person wrote it themselves.
    `;
  }

  /**
   * Calculates confidence score for generated content
   */
  private calculateConfidenceScore(content: string, voiceProfile: VoiceProfile): number {
    let score = 0.5; // Base score
    
    // Check emoji usage
    const emojiCount = (content.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu) || []).length;
    const expectedEmojiFreq = voiceProfile.emojiUsage.frequency;
    
    if (expectedEmojiFreq === 'none' && emojiCount === 0) score += 0.2;
    else if (expectedEmojiFreq === 'low' && emojiCount <= 2) score += 0.2;
    else if (expectedEmojiFreq === 'medium' && emojiCount <= 5) score += 0.2;
    else if (expectedEmojiFreq === 'high' && emojiCount > 3) score += 0.2;
    
    // Check hashtag usage
    const hashtagCount = (content.match(/#\w+/g) || []).length;
    const expectedHashtagCount = voiceProfile.hashtagStyle.count;
    
    if (Math.abs(hashtagCount - expectedHashtagCount) <= 1) score += 0.2;
    
    // Check sentence complexity
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.reduce((sum, sentence) => 
      sum + sentence.trim().split(/\s+/).length, 0) / sentences.length;
    
    const expectedLength = voiceProfile.sentenceStructure.averageLength;
    if (Math.abs(avgSentenceLength - expectedLength) <= 5) score += 0.1;
    
    return Math.min(1, Math.max(0, score));
  }

  /**
   * Processes quiz answers to create voice profile
   */
  private async processQuizAnswers(quizData: string): Promise<Partial<VoiceProfile>> {
    try {
      const quizJson = quizData.replace('Generated from personality quiz: ', '');
      const answers = JSON.parse(quizJson);
      
      // Convert quiz answers to voice attributes
      const toneAttributes = {
        professional: this.mapToneScore(answers.tone, ['formal', 'authoritative'], 0.8, 0.5),
        casual: this.mapToneScore(answers.tone, ['conversational', 'friendly'], 0.7, 0.3),
        humorous: this.mapHumorScore(answers.humor),
        inspirational: this.mapToneScore(answers.expertise, ['innovative', 'confident'], 0.6, 0.2),
        educational: this.mapToneScore(answers.stories, ['facts', 'examples'], 0.7, 0.4),
      };

      const sentenceStructure = {
        averageLength: this.mapLengthPreference(answers.length),
        complexity: this.mapComplexity(answers.tone, answers.stories),
        paragraphLength: this.mapParagraphLength(answers.length),
      };

      const emojiUsage = {
        frequency: this.mapEmojiFrequency(answers.tone, answers.humor),
        preferred: this.getPreferredEmojis(answers.tone, answers.expertise),
      };

      const hashtagStyle = {
        count: 3,
        placement: 'end' as const,
        format: 'camelCase' as const,
      };

      return {
        toneAttributes,
        vocabularyPreferences: {
          use: this.getVocabularyPreferences(answers),
          avoid: this.getAvoidWords(answers),
        },
        sentenceStructure,
        emojiUsage,
        hashtagStyle,
        keyMessages: this.generateKeyMessages(answers),
        brandPersonality: {
          communicationStyle: answers.tone,
          humorLevel: answers.humor,
          expertisePosition: answers.expertise,
          contentLength: answers.length,
          insightStyle: answers.stories,
        },
        trainingVersion: 1,
      };
    } catch (error) {
      console.error('Error processing quiz answers:', error);
      return this.getDefaultVoiceProfile();
    }
  }

  private mapToneScore(value: string, targetValues: string[], highScore: number, defaultScore: number): number {
    return targetValues.includes(value) ? highScore : defaultScore;
  }

  private mapHumorScore(humor: string): number {
    switch (humor) {
      case 'never': return 0.1;
      case 'subtle': return 0.3;
      case 'moderate': return 0.6;
      case 'frequent': return 0.8;
      default: return 0.2;
    }
  }

  private mapLengthPreference(length: string): number {
    switch (length) {
      case 'short': return 10;
      case 'medium': return 15;
      case 'long': return 25;
      case 'mixed': return 18;
      default: return 15;
    }
  }

  private mapComplexity(tone: string, stories: string): 'simple' | 'medium' | 'complex' {
    if (tone === 'formal' || stories === 'facts') return 'complex';
    if (tone === 'friendly' || stories === 'stories') return 'simple';
    return 'medium';
  }

  private mapParagraphLength(length: string): number {
    switch (length) {
      case 'short': return 2;
      case 'medium': return 3;
      case 'long': return 5;
      case 'mixed': return 3;
      default: return 3;
    }
  }

  private mapEmojiFrequency(tone: string, humor: string): 'none' | 'low' | 'medium' | 'high' {
    if (tone === 'formal') return 'none';
    if (humor === 'frequent') return 'high';
    if (humor === 'moderate') return 'medium';
    return 'low';
  }

  private getPreferredEmojis(tone: string, expertise: string): string[] {
    const emojis = [];
    if (tone === 'friendly') emojis.push('😊', '👍');
    if (expertise === 'innovative') emojis.push('💡', '🚀');
    if (expertise === 'confident') emojis.push('💪', '🎯');
    return emojis;
  }

  private getVocabularyPreferences(answers: Record<string, string>): string[] {
    const vocab = [];
    if (answers.tone === 'authoritative') vocab.push('demonstrates', 'establishes', 'proven');
    if (answers.tone === 'conversational') vocab.push('let\'s explore', 'what if', 'imagine');
    if (answers.expertise === 'innovative') vocab.push('cutting-edge', 'breakthrough', 'revolutionary');
    return vocab;
  }

  private getAvoidWords(answers: Record<string, string>): string[] {
    const avoid = [];
    if (answers.tone === 'formal') avoid.push('gonna', 'wanna', 'super cool');
    if (answers.humor === 'never') avoid.push('lol', 'haha', 'funny thing');
    return avoid;
  }

  private generateKeyMessages(answers: Record<string, string>): string[] {
    const messages = [];
    if (answers.expertise === 'innovative') messages.push('Driving innovation in the industry');
    if (answers.expertise === 'collaborative') messages.push('Building strong professional relationships');
    if (answers.stories === 'stories') messages.push('Sharing real-world experiences and lessons');
    return messages;
  }

  private getDefaultVoiceProfile(): Partial<VoiceProfile> {
    return {
      toneAttributes: {
        professional: 0.7,
        casual: 0.3,
        humorous: 0.1,
        inspirational: 0.2,
        educational: 0.5,
      },
      vocabularyPreferences: {
        use: [],
        avoid: [],
      },
      sentenceStructure: {
        averageLength: 15,
        complexity: 'medium',
        paragraphLength: 3,
      },
      emojiUsage: {
        frequency: 'low',
        preferred: [],
      },
      hashtagStyle: {
        count: 3,
        placement: 'end',
        format: 'camelCase',
      },
      keyMessages: [],
      brandPersonality: {},
      trainingVersion: 1,
    };
  }

  /**
   * Updates voice profile based on user feedback
   */
  async updateFromFeedback(
    voiceProfile: VoiceProfile,
    content: string,
    feedback: 'approve' | 'edit' | 'reject',
    editedContent?: string
  ): Promise<Partial<VoiceProfile>> {
    // For MVP, just return the existing profile
    // In future iterations, we can implement ML-based profile updates
    return voiceProfile;
  }
}