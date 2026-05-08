import React, { useState, useEffect, useMemo } from 'react';
import { Search, Copy, Check, Terminal, Shield, Cpu, Package, BookOpen } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { api } from '../utils/api';

const CapabilitiesDashboard = () => {
  const [indexContent, setIndexContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [copyingId, setCopyingId] = useState(null);

  useEffect(() => {
    const fetchCapabilities = async () => {
      try {
        const response = await api.capabilities();
        const data = await response.json();
        setIndexContent(data.content);
      } catch (error) {
        console.error('Failed to fetch capabilities:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCapabilities();
  }, []);

  const parsedCapabilities = useMemo(() => {
    if (!indexContent) return [];
    
    const sections = [];
    const lines = indexContent.split('\n');
    let currentSection = null;

    lines.forEach(line => {
      if (line.startsWith('## ')) {
        currentSection = {
          title: line.replace('## ', '').trim(),
          items: []
        };
        sections.push(currentSection);
      } else if (line.startsWith('- **') && currentSection) {
        const match = line.match(/- \*\*([^*]+)\*\*(?::)?\s*(.*)/);
        if (match) {
          currentSection.items.push({
            name: match[1].trim(),
            description: match[2].trim()
          });
        }
      }
    });

    return sections;
  }, [indexContent]);

  const filteredCapabilities = useMemo(() => {
    if (!searchQuery) return parsedCapabilities;
    
    const query = searchQuery.toLowerCase();
    return parsedCapabilities.map(section => ({
      ...section,
      items: section.items.filter(item => 
        item.name.toLowerCase().includes(query) || 
        item.description.toLowerCase().includes(query)
      )
    })).filter(section => section.items.length > 0);
  }, [parsedCapabilities, searchQuery]);

  const handleCopy = (command, id) => {
    navigator.clipboard.writeText(command);
    setCopyingId(id);
    setTimeout(() => setCopyingId(null), 2000);
  };

  const getSectionIcon = (title) => {
    if (title.includes('CORE')) return <Cpu className="w-5 h-5 text-blue-500" />;
    if (title.includes('SECURITY')) return <Shield className="w-5 h-5 text-red-500" />;
    if (title.includes('SKILLS')) return <Package className="w-5 h-5 text-purple-500" />;
    if (title.includes('MEMORY')) return <BookOpen className="w-5 h-5 text-green-500" />;
    return <Terminal className="w-5 h-5 text-gray-500" />;
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-auto p-6 space-y-8">
      <div className="flex flex-col items-center justify-center space-y-4 py-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
          Gemini CLI Control Center
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Explore your agent's capabilities and generate functional commands instantly.
        </p>
        <div className="relative w-full max-w-2xl mt-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            placeholder="Search for a skill, security audit, or command..."
            className="pl-12 h-14 text-lg rounded-2xl shadow-lg border-primary/20 focus:border-primary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
          {filteredCapabilities.map((section, sIdx) => (
            <div key={sIdx} className="space-y-4">
              <div className="flex items-center space-x-2 px-2">
                {getSectionIcon(section.title)}
                <h2 className="text-xl font-semibold">{section.title}</h2>
              </div>
              {section.items.map((item, iIdx) => {
                const itemId = `${sIdx}-${iIdx}`;
                const isCommand = section.title.includes('COMMAND');
                
                return (
                  <Card key={itemId} className="gemini-card overflow-hidden group">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm font-medium flex justify-between items-center">
                        <span className="text-primary">{item.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleCopy(item.name, itemId)}
                        >
                          {copyingId === itemId ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CapabilitiesDashboard;
