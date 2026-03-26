import { NextRequest, NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage } from "@langchain/core/messages";
import { HederaLangchainToolkit } from "hedera-agent-kit";
import { Client, AccountId, PrivateKey } from "@hashgraph/sdk";

export async function POST(req: NextRequest) {
  try {
    const { messages, accountId } = await req.json();

    // Build Hedera client
    const operatorId = AccountId.fromString(process.env.HEDERA_OPERATOR_ID!);
    const operatorKey = PrivateKey.fromStringED25519(process.env.HEDERA_OPERATOR_KEY!);

    const client =
      process.env.NEXT_PUBLIC_HEDERA_NETWORK === "mainnet"
        ? Client.forMainnet()
        : Client.forTestnet();

    client.setOperator(operatorId, operatorKey);

    // Build LangChain toolkit with Hedera tools
    const toolkit = new HederaLangchainToolkit({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      client: client as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      configuration: {} as any,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tools = toolkit.getTools() as any[];

    // LLM via OpenRouter (OpenAI-compatible)
    const llm = new ChatOpenAI({
      modelName: "openai/gpt-4o-mini",
      openAIApiKey: process.env.OPENROUTER_API_KEY,
      configuration: {
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "NombreApp Hackathon",
        },
      },
    });

    const systemPrompt = `Sos un asistente inteligente de un marketplace tokenizado construido sobre Hedera blockchain.
El usuario conectado tiene la cuenta Hedera: ${accountId ?? "desconocida"}.
Podés consultar balances de HBAR, tokens HTS, información de cuentas y ejecutar transferencias.
Respondé siempre en español, de forma concisa y clara.
Si el usuario no especifica una cuenta, usá la suya: ${accountId ?? "desconocida"}.`;

    const agent = createReactAgent({
      llm,
      tools,
      messageModifier: systemPrompt,
    });

    const lastUserMessage = messages[messages.length - 1];

    const result = await agent.invoke({
      messages: [new HumanMessage(lastUserMessage.content)],
    });

    const lastMessage = result.messages[result.messages.length - 1];
    const responseContent =
      typeof lastMessage.content === "string"
        ? lastMessage.content
        : JSON.stringify(lastMessage.content);

    return NextResponse.json({ response: responseContent });
  } catch (error) {
    console.error("Agent error:", error);
    return NextResponse.json(
      { response: "Error al procesar la consulta. Verificá la configuración del agente." },
      { status: 500 }
    );
  }
}
