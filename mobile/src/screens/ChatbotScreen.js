import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TextInput, 
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAppTheme } from '../context/ThemeContext';
import { requestGraphQL } from '../utils/api';
import { Ionicons } from '@expo/vector-icons';

const ASK_CHATBOT_MUTATION = `
  mutation AskChatbot($message: String!) {
    askChatbot(message: $message)
  }
`;

export default function ChatbotScreen() {
  const { isDarkMode } = useAppTheme();
  
  const [messages, setMessages] = useState([
    { id: '1', text: 'Olá! Sou o assistente inteligente do InsightGestor. Posso ajudar com análises do estoque ou de vendas. Como posso te ajudar hoje?', sender: 'ai' }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);

  const themeBgColor = isDarkMode ? '#15181c' : '#f1f5f9';
  const themeTextColor = isDarkMode ? '#f8fafc' : '#212121';
  const themeSubTextColor = isDarkMode ? '#94a3b8' : '#64748b';
  const primaryColor = isDarkMode ? '#00b377' : '#008055';
  const cardBgColor = isDarkMode ? '#20252b' : '#ffffff';
  const inputBgColor = isDarkMode ? '#2d333b' : '#f8fafc';
  const themeBorderColor = isDarkMode ? '#30363d' : '#dbe1e8';

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMsg = { id: Date.now().toString(), text: inputText.trim(), sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const response = await requestGraphQL(ASK_CHATBOT_MUTATION, { message: userMsg.text });
      const aiMsg = { 
        id: (Date.now() + 1).toString(), 
        text: response.askChatbot || 'Desculpe, não consegui processar a resposta.', 
        sender: 'ai' 
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg = { 
        id: (Date.now() + 1).toString(), 
        text: `Erro: ${err.message}`, 
        sender: 'error' 
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const isUser = item.sender === 'user';
    const isError = item.sender === 'error';
    
    return (
      <View style={[
        styles.messageBubble, 
        isUser ? [styles.userBubble, { backgroundColor: primaryColor }] : 
        isError ? [styles.aiBubble, { backgroundColor: '#fee2e2' }] :
        [styles.aiBubble, { backgroundColor: cardBgColor, borderColor: themeBorderColor, borderWidth: 1 }]
      ]}>
        <Text style={[
          styles.messageText, 
          isUser ? { color: '#ffffff' } : 
          isError ? { color: '#ef4444' } : 
          { color: themeTextColor }
        ]}>
          {item.text}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeBgColor }]} edges={['top', 'left', 'right']}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} backgroundColor={themeBgColor} />
      
      <View style={[styles.header, { borderBottomColor: themeBorderColor, borderBottomWidth: 1 }]}>
        <Ionicons name="sparkles" size={24} color={primaryColor} />
        <View style={{ marginLeft: 12 }}>
          <Text style={[styles.headerTitle, { color: themeTextColor }]}>IA Assistente</Text>
          <Text style={[styles.headerSubtitle, { color: themeSubTextColor }]}>Consultas de vendas e estoque</Text>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={[styles.inputContainer, { backgroundColor: cardBgColor, borderTopColor: themeBorderColor }]}>
          <TextInput
            style={[styles.input, { backgroundColor: inputBgColor, color: themeTextColor, borderColor: themeBorderColor }]}
            placeholder="Pergunte algo sobre vendas..."
            placeholderTextColor={themeSubTextColor}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={300}
          />
          <TouchableOpacity 
            style={[styles.sendButton, { backgroundColor: inputText.trim() ? primaryColor : themeSubTextColor }]} 
            onPress={handleSend}
            disabled={!inputText.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Ionicons name="send" size={18} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'flex-end',
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  }
});
