import React from 'react';
import MetricWidget from './MetricWidget';
import ChartWidget from './ChartWidget';
import TableWidget from './TableWidget';
import ListWidget from './ListWidget';

const WidgetRenderer = ({ widget, data, language = 'en' }) => {
  const renderWidget = () => {
    switch (widget.widget_type) {
      case 'metric':
        return (
          <MetricWidget 
            widget={widget} 
            data={data} 
            language={language} 
          />
        );
      
      case 'chart':
        return (
          <ChartWidget 
            widget={widget} 
            data={data} 
            language={language} 
          />
        );
      
      case 'table':
        return (
          <TableWidget 
            widget={widget} 
            data={data} 
            language={language} 
          />
        );
      
      case 'list':
        return (
          <ListWidget 
            widget={widget} 
            data={data} 
            language={language} 
          />
        );
      
      default:
        return (
          <div className="bg-background-secondary rounded-lg p-6 border border-border">
            <div className="text-center text-text-muted">
              <p>Unknown widget type: {widget.widget_type}</p>
            </div>
          </div>
        );
    }
  };

  return renderWidget();
};

export default WidgetRenderer; 