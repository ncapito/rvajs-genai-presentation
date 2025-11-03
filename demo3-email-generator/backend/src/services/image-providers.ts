/**
 * Image Generation Provider Abstraction
 *
 * Allows switching between different image generation services:
 * - DALL-E (Azure OpenAI)
 * - Stability AI
 * - Midjourney
 * - etc.
 */

import { azureImageClient, azureLLM, memeConfig } from '../config/azure.config.js';
import { ChatOpenAI } from '@langchain/openai';

// Provider interface
export interface ImageGenerationProvider {
  name: string;
  generateImage(prompt: string, timeout: number): Promise<string | null>;
}

// DALL-E Provider (current implementation)
export class AzureFoundryProvider implements ImageGenerationProvider {
  name = 'Azure Foundry';

  async generateImage(prompt: string, timeout: number): Promise<string | null> {
    try {
      console.log(`  🖼️  Image Generation Request:`);
      console.log(`     Model: ${memeConfig.imageDeployment}`);
      console.log(`     Endpoint: ${process.env.IMAGE_ENDPOINT_URL || process.env.AZURE_OPENAI_ENDPOINT}`);
      console.log(`     Timeout: ${timeout}ms`);

      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error('Image generation timeout')), timeout);
      });

      const generatePromise = azureImageClient.images.generate({
        model: memeConfig.imageDeployment,
        prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        style: 'natural',
      });

      const result = await Promise.race([generatePromise, timeoutPromise]);

      if (!result || !result.data || result.data.length === 0) {
        console.error(`  ❌ Image generation: No data returned (empty response)`);
        return null;
      }

      const imageData = result.data[0];

      // Check for URL (DALL-E 3 default)
      if (imageData?.url) {
        console.log(`  ✅ Image URL received`);
        return imageData.url;
      }

      // Check for base64 (FLUX, some other models)
      if (imageData?.b64_json) {
        console.log(`  ✅ Base64 image received, converting to data URL`);
        const base64Data = imageData.b64_json;
        // Convert to data URL that can be embedded in HTML
        return `data:image/png;base64,${base64Data}`;
      }

      // Neither format found
      console.error(`  ❌ Image generation: No URL or base64 data in response`);
      console.error(`     Response:`, JSON.stringify(result, null, 2));
      return null;
    } catch (error: any) {
      // Detailed error logging
      console.error(`  ❌ DALL-E generation failed:`);
      console.error(`     Error type: ${error.constructor.name}`);
      console.error(`     Message: ${error.message}`);

      // Check for Azure-specific error details
      if (error.code) {
        console.error(`     Code: ${error.code}`);
      }
      if (error.status) {
        console.error(`     Status: ${error.status}`);
      }
      if (error.response) {
        console.error(`     Response:`, JSON.stringify(error.response, null, 2));
      }
      if (error.cause) {
        console.error(`     Cause:`, error.cause);
      }

      // Full error object for debugging
      console.error(`     Full error:`, error);

      return null;
    }
  }
}


// Provider Factory
export function getImageProvider(): ImageGenerationProvider {
  const providerName = process.env.IMAGE_PROVIDER || "azurefoundry";

  switch (providerName.toLowerCase()) {
    case 'azurefoundry':
      return new AzureFoundryProvider();

    default:
      console.warn(`Unknown provider "${providerName}", using DALL-E`);
      return new AzureFoundryProvider();
  }
}

// Export singleton instance
export const imageProvider = getImageProvider();
