import json
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.responses import FileResponse
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from base64 import b64encode
import openai

from langchain.llms import OpenAI

load_dotenv()

OPEN_AI_KEY = os.getenv('OPEN_AI_KEY')
openai.api_key = OPEN_AI_KEY
os.environ['OPENAI_API_KEY'] = OPEN_AI_KEY

llm = OpenAI(temperature=0, max_tokens=3000)


class PromptRequest(BaseModel):
    user_prompt: str

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with your frontend URL
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

#append to this list

function_descriptions = [
    {
        "name":"borrow_gho",
        "description":"Provide details of amount of GHO token to be borrowed. Eg prompt : Borrow/fetch 10 GHO tokens",
        "parameters": {
            "type": "object",
            "properties": {
                "amount": {
                    "type": "string",
                    "description": "The amount of GHO token to be borrowed, e.g. 10 GHO",
                },
            },
            "required": ["amount"],
        },
    },

    {
        "name":"send_funds_to_address",
        "description":"Provide details of address,amount to be transferred",
        "parameters": {
            "type": "object",
            "properties": {
                "receiver_address": {
                    "type": "string",
                    "description": "The receiver address, e.g. abhishek.eth",
                },
                "amount": {
                    "type": "string",
                    "description": "The amount of eth to be transferred, e.g. 0.01",
                },
            },
            "required": ["receiver_address", "amount"],
        },
    },
        {
        "name":"setup_recurring_payments",
        "description":"Provide details of address,amount,frequency of the recurrent payment to be setup and end date in seconds.Eg : Pay abhishek.eth 5 eth every 100 seconds for the next hour",
        "parameters": {
            "type": "object",
            "properties": {
                "receiver_address": {
                    "type": "string",
                    "description": "The receiver address, e.g. abhishek.eth",
                },
                "amount": {
                    "type": "string",
                    "description": "The amount of tokens to be transferred, e.g. 0.01",
                },
                "frequency":{
                    "type":"string",
                    "description":"The frequency after which the payment should be trigerred again, always return the value in seconds. Eg : 100 seconds or if the user gives 5 days, convert it to seconds and return"
                },
                "end_time":{
                    "type":"string",
                    "description":"The time for which we want the payment to go on,convert this in seconds and give, example: payment till the next minute, then it should return 60 seconds "
                }
            },
            "required": ["receiver_address", "amount","start_date"],
        },
    }

]

def process_prompt(user_prompt):
    completion = openai.ChatCompletion.create(
    model="gpt-3.5-turbo-0613",
    messages=[{"role": "user", "content": user_prompt}],
    # add function calling
    functions=function_descriptions,
    function_call="auto",  # specify the function call
    )
    output = completion.choices[0].message
    return output

@app.post("/processPrompt")
async def generate(request: PromptRequest):
    try:
        user_prompt = request.user_prompt
        print('received user query : '+user_prompt)
        # return {
        #     "receiver_address":"abhishek0405.eth",
        #     "amount":"0.001"
        # }
        response = process_prompt(user_prompt)
        response_obj =  json.loads(response.function_call.arguments)
        response_obj["function_name"] = response.function_call.name
        return response_obj
    except Exception as e:
        print("Unexpected error occurred ",e)