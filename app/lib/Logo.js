'use client';

import React from 'react';
import Image from 'next/image';
import { APP_NAME } from '../constants';

const Logo = ({ 
    width = 200, 
    height = 40, 
    className = '',
    style = {},
    ...props 
}) => {
    return (
        <Image
            src="/logo.png"
            alt={APP_NAME}
            width={width}
            height={height}
            className={className}
            style={{
                objectFit: 'contain',
                maxWidth: '100%',
                height: 'auto',
                ...style
            }}
            {...props}
        />
    );
};

export default Logo;