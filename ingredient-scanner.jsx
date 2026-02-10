import React, { useState, useRef } from 'react';
import { Camera, Upload, Loader2, RotateCcw } from 'lucide-react';

export default function IngredientScanner() {
  const [image, setImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target.result);
        setResults(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!image) return;

    setAnalyzing(true);
    setError(null);

    try {
      const base64Data = image.split(',')[1];
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: base64Data
                }
              },
              {
                type: 'text',
                text: `Please analyze this image and look for ingredient lists. For each ingredient you find:
1. Extract the ingredient name exactly as written
2. Provide a simple, easy-to-understand explanation of what it is
3. If it's a chemical/scientific name, translate it to common terms

Format your response as JSON only (no markdown):
{
  "ingredients": [
    {
      "name": "ingredient name",
      "explanation": "simple explanation"
    }
  ]
}

If no ingredients found:
{
  "ingredients": [],
  "message": "No ingredient list found"
}`
              }
            ]
          }]
        })
      });

      const data = await response.json();
      const textContent = data.content.find(item => item.type === 'text');
      
      if (!textContent) {
        throw new Error('No response from API');
      }

      let jsonText = textContent.text.trim();
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      const result = JSON.parse(jsonText);
      
      setResults(result);
    } catch (err) {
      console.error('Error:', err);
      setError('Sorry, there was an error analyzing the image. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => {
    setImage(null);
    setResults(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-700 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center text-white mb-8 pt-6">
          <h1 className="text-4xl font-bold mb-2">🔍 Ingredient Scanner</h1>
          <p className="text-lg opacity-90">Snap, scan, and simplify ingredients</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 mb-4">
          {!image ? (
            // Upload Area
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageCapture}
                className="hidden"
                id="camera-input"
              />
              <label
                htmlFor="camera-input"
                className="block border-4 border-dashed border-purple-400 rounded-2xl p-12 text-center cursor-pointer hover:border-purple-600 hover:bg-purple-50 transition-all bg-purple-50/50"
              >
                <Camera className="w-16 h-16 mx-auto mb-4 text-purple-600" />
                <div className="text-purple-600 text-lg font-semibold">
                  Tap to take a photo or upload an image
                </div>
                <div className="text-gray-500 text-sm mt-2">
                  Point your camera at ingredient labels
                </div>
              </label>
            </div>
          ) : (
            // Image Preview & Analysis
            <div>
              <img 
                src={image} 
                alt="Captured ingredient label" 
                className="w-full rounded-xl mb-4 shadow-md"
              />
              
              {!results && !analyzing && (
                <button
                  onClick={analyzeImage}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-xl font-semibold text-lg hover:shadow-lg transition-all"
                >
                  Analyze Ingredients
                </button>
              )}

              {analyzing && (
                <div className="text-center py-8">
                  <Loader2 className="w-12 h-12 mx-auto mb-4 text-purple-600 animate-spin" />
                  <div className="text-gray-600">Analyzing your image...</div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results */}
        {results && (
          <div className="bg-white rounded-3xl shadow-2xl p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Simplified Ingredients
            </h2>
            
            {results.message ? (
              <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-lg">
                <p className="text-gray-700">{results.message}</p>
              </div>
            ) : results.ingredients && results.ingredients.length > 0 ? (
              <div className="space-y-3">
                {results.ingredients.map((ingredient, index) => (
                  <div 
                    key={index}
                    className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-lg"
                  >
                    <div className="font-semibold text-gray-800 mb-1">
                      {ingredient.name}
                    </div>
                    <div className="text-gray-600 text-sm leading-relaxed">
                      {ingredient.explanation}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-lg">
                <p className="text-gray-700">No ingredients found in this image.</p>
              </div>
            )}

            <button
              onClick={reset}
              className="w-full mt-4 border-2 border-purple-600 text-purple-600 py-3 rounded-xl font-semibold hover:bg-purple-50 transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Scan Another Product
            </button>
          </div>
        )}
      </div>
    </div>
  );
}