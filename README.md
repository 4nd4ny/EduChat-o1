# EduChat

This project is based on [EduChat-4o](https://github.com/4nd4ny/EduChat-4o), which itself is based on the [GPT-4 Playground](https://github.com/Nashex/gpt4-playground) project by [Nashex](https://github.com/Nashex).

## Overview

EduChat is designed for educational institutions aiming to provide their students with free access to the latest versions of OpenAI's artificial intelligence models. The installation on a server is accomplished easily using a few simple commands, enabling quick and efficient implementation of this educational tool.

## Key Features

- Easy server installation
- Access to multiple AI models (ChatGPT-4, O1-mini, O1-preview)
- Cost-effective approach to AI usage in education

## Differences from EduChat-4o

The main difference from [EduChat-4o](https://github.com/4nd4ny/EduChat-4o) is the implementation of a regeneration mechanism:

1. Initial response: ChatGPT-4
2. First regeneration: O1-mini
3. Second regeneration: O1-preview

This mechanism helps limit costs while still providing access to the best model for all students. The playground parameters have been removed as they are not supported by O1-mini and O1-preview.

## Development Notes

This is my first React/Next.js/TypeScript/Flex project. Thanks to ChatGPT, I was able to develop this quickly in a learning-by-doing approach.

**Note:** As a full-time teacher at Chamblandes's gymnasium in Switzerland, I have limited time for maintaining this project, making improvements, or fixing bugs.

## Installation

To install this project, create a `.env` file in the root folder of the project (same folder as `src`), with the following entries:

```
REACT_APP_API_KEY=sk-proj-blablabla
REACT_APP_ORG_KEY=org-blablabla <-- Can be removed
REACT_APP_USER_ID=user-blablabla <-- Can be removed
REACT_APP_PASSWD=password
```

**Note:** `ORG_KEY` and `USER_ID` will be used for billing calculations later. 

## Running Locally

To run this project locally, you will need to have [Node.js](https://nodejs.org/en/) installed. Once you have Node.js installed, clone this repository and run the following commands:

```bash
yarn install
yarn dev
```

This will start a local server on port 3000. You can then navigate to `localhost:3000` to view the project.
