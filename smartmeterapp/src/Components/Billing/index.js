
import React, { useState, useEffect, useRef,useMemo} from 'react';
import axios from 'axios';

import BASE_URL from '../../apiConfig'; // Adjust path based on your file structure
import './index.css'

  const manualCategories = [
    {
      name: 'Payment',
      items: [
        { name: 'Residual credit', code: '3,0-0:19.130.0.255'},
        { name: 'Energy used', code: '3,1-0:15.9.0.255'},
        { name: 'Currency used', code: '3,0-0:19.133.0.255' },
        { name: 'Cumulative purchase credit', code: '3,1-65:1.140.2.255' },
        { name: 'Last purchase credit', code: '3,1-65:1.1.140.10.255' },
      ],
    },
    {
      name: 'Active Energy register',
      
        items: [
          { "name": "Active energy import (+A)", "code": "3,1-0:1.8.0.255" },
          { "name": "Active energy import (+A) rate 1", "code": "3,1-0:1.8.1.255" },
          { "name": "Active energy import (+A) rate 2", "code": "3,1-0:1.8.2.255" },
          { "name": "Active energy import (+A) rate 3", "code": "3,1-0:1.8.3.255" },
          { "name": "Active energy import (+A) rate 4", "code": "3,1-0:1.8.4.255" },
          { "name": "Active energy export (-A)", "code": "3,1-0:2.8.0.255" },
          { "name": "Active energy export (-A) rate 1", "code": "3,1-0:2.8.1.255" },
          { "name": "Active energy export (-A) rate 2", "code": "3,1-0:2.8.2.255" },
          { "name": "Active energy export (-A) rate 3", "code": "3,1-0:2.8.3.255" },
          { "name": "Active energy export (-A) rate 4", "code": "3,1-0:2.8.4.255" },
          { "name": "Active energy Combined total (|+A| + |-A|)", "code": "3,1-0:15.8.0.255" },
          { "name": "Active energy Combined total (|+A| + |-A|) rate 1", "code": "3,1-0:15.8.1.255" },
          { "name": "Active energy Combined total (|+A| + |-A|) rate 2", "code": "3,1-0:15.8.2.255" },
          { "name": "Active energy Combined total (|+A| + |-A|) rate 3", "code": "3,1-0:15.8.3.255" },
          { "name": "Active energy Combined total (|+A| + |-A|) rate 4", "code": "3,1-0:15.8.4.255" },
          { "name": "Active energy Combined total (|+A| - |-A|)", "code": "3,1-0:16.8.0.255" },
          { "name": "Active energy Combined total (|+A| - |-A|) rate 1", "code": "3,1-0:16.8.1.255" },
          { "name": "Active energy Combined total (|+A| - |-A|) rate 2", "code": "3,1-0:16.8.2.255" },
          { "name": "Active energy Combined total (|+A| - |-A|) rate 3", "code": "3,1-0:16.8.3.255" },
          { "name": "Active energy Combined total (|+A| - |-A|) rate 4", "code": "3,1-0:16.8.4.255" }
        ]    
        },


        {
          name: "Reactive Energy Register",
          items: [
            { "name": "Reactive energy import (+R)", "code": "3,1-0:3.8.0.255" },
            { "name": "Reactive energy import (+R) rate 1", "code": "3,1-0:3.8.1.255" },
            { "name": "Reactive energy import (+R) rate 2", "code": "3,1-0:3.8.2.255" },
            { "name": "Reactive energy import (+R) rate 3", "code": "3,1-0:3.8.3.255" },
            { "name": "Reactive energy import (+R) rate 4", "code": "3,1-0:3.8.4.255" },
            { "name": "Reactive energy export (-R)", "code": "3,1-0:4.8.0.255" },
            { "name": "Reactive energy export (-R) rate 1", "code": "3,1-0:4.8.1.255" },
            { "name": "Reactive energy export (-R) rate 2", "code": "3,1-0:4.8.4.255" },
            { "name": "Reactive energy export (-R) rate 3", "code": "3,1-0:4.8.3.255" },
            { "name": "Reactive energy QI (+Ri)", "code": "3,1-0:5.8.0.255" },
            { "name": "Reactive energy QI (+Ri) rate 1", "code": "3,1-0:5.8.1.255" },
            { "name": "Reactive energy QI (+Ri) rate 2", "code": "3,1-0:5.8.2.255" },
            { "name": "Reactive energy QI (+Ri) rate 3", "code": "3,1-0:5.8.3.255" },
            { "name": "Reactive energy QI (+Ri) rate 4", "code": "3,1-0:5.8.4.255" },
            { "name": "Reactive energy QII (+Rc)", "code": "3,1-0:6.8.0.255" },
            { "name": "Reactive energy QII (+Rc) rate 1", "code": "3,1-0:6.8.1.255" },
            { "name": "Reactive energy QII (+Rc) rate 2", "code": "3,1-0:6.8.2.255" },
            { "name": "Reactive energy QII (+Rc) rate 3", "code": "3,1-0:6.8.3.255" },
            { "name": "Reactive energy QII (+Rc) rate 4", "code": "3,1-0:5.6.4.255" },
            { "name": "Reactive energy QIII (-Ri)", "code": "3,1-0:7.8.0.255" },
            { "name": "Reactive energy QIII (-Ri) rate 1", "code": "3,1-0:7.8.1.255" },
            { "name": "Reactive energy QIII (-Ri) rate 2", "code": "3,1-0:7.8.2.255" },
            { "name": "Reactive energy QIII (-Ri) rate 3", "code": "3,1-0:7.8.3.255" },
            { "name": "Reactive energy QIII (-Ri) rate 4", "code": "3,1-0:7.8.4.255" },
            { "name": "Reactive energy QIV (-Rc)", "code": "3,1-0:8.8.0.255" },
            { "name": "Reactive energy QIV (-Rc) rate 1", "code": "3,1-0:8.8.1.255" },
            { "name": "Reactive energy QIV (-Rc) rate 2", "code": "3,1-0:8.8.2.255" },
            { "name": "Reactive energy QIV (-Rc) rate 3", "code": "3,1-0:8.8.3.255" },
            { "name": "Reactive energy QIV (-Rc) rate 4", "code": "3,1-8:5.6.4.255" }
          ]
        },

        {
          name: "Apparent Energy Register",
          items: [
            { "name": "Apparent energy import (+VA)", "code": "3,1-0:9.8.0.255" },
            { "name": "Apparent energy import (+VA) rate 1", "code": "3,1-0:9.8.1.255" },
            { "name": "Apparent energy import (+VA) rate 2", "code": "3,1-0:9.8.2.255" },
            { "name": "Apparent energy import (+VA) rate 3", "code": "3,1-0:9.8.3.255" },
            { "name": "Apparent energy import (+VA) rate 4", "code": "3,1-0:9.8.4.255" },
            { "name": "Apparent energy export (-VA)", "code": "3,1-0:10.8.0.255" },
            { "name": "Apparent energy export (-VA) rate 1", "code": "3,1-0:10.8.1.255" },
            { "name": "Apparent energy export (-VA) rate 2", "code": "3,1-0:10.8.2.255" },
            { "name": "Apparent energy export (-VA) rate 3", "code": "3,1-0:10.8.3.255" },
            { "name": "Apparent energy export (-VA) rate 4", "code": "3,1-0:10.8.4.255" }
          ]
        },

        {
          "name": "Active Maximum Demand Register",
          items: [
            { "name": "Maximum Demand Register - Active import (+A)", "code": "4,1-0:1.6.0.255" },
            { "name": "Capture time - Maximum Demand Register - Active import (+A)", "code": "4,1-0:1.6.0.255" },
            { "name": "Maximum Demand Register - Active import (+A) - rate 1", "code": "4,1-0:1.6.1.255" },
            { "name": "Capture time - Maximum Demand Register - Active import (+A) - rate 1", "code": "4,1-0:1.6.1.255" },
            { "name": "Maximum Demand Register - Active import (+A) - rate 2", "code": "4,1-0:1.6.2.255" },
            { "name": "Capture time - Maximum Demand Register - Active import (+A) - rate 2", "code": "4,1-0:1.6.2.255" },
            { "name": "Maximum Demand Register - Active import (+A) - rate 3", "code": "4,1-0:1.6.3.255" },
            { "name": "Capture time - Maximum Demand Register - Active import (+A) - rate 3", "code": "4,1-0:1.6.3.255" },
            { "name": "Maximum Demand Register - Active import (+A) - rate 4", "code": "4,1-0:1.6.3.255" },
            { "name": "Capture time - Maximum Demand Register - Active import (+A) - rate 4", "code": "4,1-0:1.6.3.255" },
            { "name": "Maximum Demand Register - Active export (-A)", "code": "4,1-0:2.6.0.255" },
            { "name": "Capture time - Maximum Demand Register - Active export (-A)", "code": "4,1-0:2.6.0.255" },
            { "name": "Maximum Demand Register - Active export (-A) - rate 1", "code": "4,1-0:2.6.1.255" },
            { "name": "Capture time - Maximum Demand Register - Active export (-A) - rate 1", "code": "4,1-0:2.6.1.255" },
            { "name": "Maximum Demand Register - Active export (-A) - rate 2", "code": "4,1-0:2.6.2.255" },
            { "name": "Capture time - Maximum Demand Register - Active export (-A) - rate 2", "code": "4,1-0:2.6.2.255" },
            { "name": "Maximum Demand Register - Active export (-A) - rate 3", "code": "4,1-0:2.6.3.255" },
            { "name": "Capture time - Maximum Demand Register - Active export (-A) - rate 3", "code": "4,1-0:2.6.3.255" },
            { "name": "Maximum Demand Register - Active export (-A) - rate 4", "code": "4,1-0:2.6.3.255" },
            { "name": "Capture time - Maximum Demand Register - Active export (-A) - rate 4", "code": "4,1-0:2.6.3.255" },
            { "name": "Maximum Demand Register - Active (|+A| + |-A|)", "code": "4,1-0:15.6.0.255" },
            { "name": "Capture time - Maximum Demand Register - Active (|+A| + |-A|)", "code": "4,1-0:15.6.0.255" },
            { "name": "Maximum Demand Register - Active (|+A| + |-A|) - rate 1", "code": "4,1-0:15.6.1.255" },
            { "name": "Capture time - Maximum Demand Register - Active (|+A| + |-A|) - rate 1", "code": "4,1-0:15.6.1.255" },
            { "name": "Maximum Demand Register - Active (|+A| + |-A|) - rate 2", "code": "4,1-0:15.6.2.255" },
            { "name": "Capture time - Maximum Demand Register - Active (|+A| + |-A|) - rate 2", "code": "4,1-0:15.6.2.255" },
            { "name": "Maximum Demand Register - Active (|+A| + |-A|) - rate 3", "code": "4,1-0:15.6.3.255" },
            { "name": "Capture time - Maximum Demand Register - Active (|+A| + |-A|) - rate 3", "code": "4,1-0:15.6.3.255" },
            { "name": "Maximum Demand Register - Active (|+A| + |-A|) - rate 4", "code": "4,1-0:15.6.3.255" },
            { "name": "Capture time - Maximum Demand Register - Active (|+A| + |-A|) - rate 4", "code": "4,1-0:15.6.3.255" },
            { "name": "Cumulative Maximum Demand Register - Active (|+A| + |-A|)", "code": "4,1-0:15.2.0.255" },
            { "name": "Capture time - Maximum Demand Register - Active (|+A| + |-A|)", "code": "4,1-0:15.2.0.255" },
            { "name": "Cumulative Maximum Demand Register - Active (|+A| + |-A|) - rate 1", "code": "4,1-0:15.2.1.255" },
            { "name": "Capture time - Maximum Demand Register - Active (|+A| + |-A|) - rate 1", "code": "4,1-0:15.2.1.255" },
            { "name": "Cumulative Maximum Demand Register - Active (|+A| + |-A|) - rate 2", "code": "4,1-0:15.2.2.255" },
            { "name": "Capture time - Maximum Demand Register - Active (|+A| + |-A|) - rate 2", "code": "4,1-0:15.2.2.255" },
            { "name": "Cumulative Maximum Demand Register - Active (|+A| + |-A|) - rate 3", "code": "4,1-0:15.2.3.255" },
            { "name": "Capture time - Maximum Demand Register - Active (|+A| + |-A|) - rate 3", "code": "4,1-0:15.2.3.255" },
            { "name": "Cumulative Maximum Demand Register - Active (|+A| + |-A|) - rate 4", "code": "4,1-0:15.2.4.255" },
            { "name": "Capture time - Maximum Demand Register - Active (|+A| + |-A|) - rate 4", "code": "4,1-0:15.2.4.255" },
            { "name": "Cumulative Maximum Demand Register - Active import (+A)", "code": "4,1-0:1.2.0.255" },
            { "name": "Capture time - Maximum Demand Register - Active import (+A)", "code": "4,1-0:1.2.0.255" },
            { "name": "Cumulative Maximum Demand Register - Active import - rate 1 (+A)", "code": "4,1-0:1.2.1.255" },
            { "name": "Capture time - Maximum Demand Register - Active import - rate 1 (+A)", "code": "4,1-0:1.2.1.255" },
            { "name": "Cumulative Maximum Demand Register - Active import - rate 2 (+A)", "code": "4,1-0:1.2.2.255" },
            { "name": "Capture time - Maximum Demand Register - Active import - rate 2 (+A)", "code": "4,1-0:1.2.2.255" },
            { "name": "Cumulative Maximum Demand Register - Active import - rate 3 (+A)", "code": "4,1-0:1.2.3.255" },
            { "name": "Capture time - Maximum Demand Register - Active import - rate 3 (+A)", "code": "4,1-0:1.2.3.255" },
            { "name": "Cumulative Maximum Demand Register - Active import - rate 4 (+A)", "code": "4,1-0:1.2.4.255" },
            { "name": "Capture time - Maximum Demand Register - Active import - rate 4 (+A)", "code": "4,1-0:1.2.4.255" },
            { "name": "Cumulative Maximum Demand Register - Active export (-A)", "code": "4,1-0:2.2.0.255" },
            { "name": "Capture time - Maximum Demand Register - Active export (-A)", "code": "4,1-0:2.2.0.255" },
            { "name": "Cumulative Maximum Demand Register - Active export - rate 1 (-A)", "code": "4,1-0:2.2.1.255" },
            { "name": "Capture time - Maximum Demand Register - Active export - rate 1 (-A)", "code": "4,1-0:2.2.1.255" },
            { "name": "Cumulative Maximum Demand Register - Active export - rate 2 (-A)", "code": "4,1-0:2.2.2.255" },
            { "name": "Capture time - Maximum Demand Register - Active export - rate 2 (-A)", "code": "4,1-0:2.2.2.255" },
            { "name": "Cumulative Maximum Demand Register - Active export - rate 3 (-A)", "code": "4,1-0:2.2.3.255" },
            { "name": "Capture time - Maximum Demand Register - Active export - rate 3 (-A)", "code": "4,1-0:2.2.3.255" },
            { "name": "Cumulative Maximum Demand Register - Active export - rate 4 (-A)", "code": "4,1-0:2.2.4.255" },
            { "name": "Capture time - Maximum Demand Register - Active export - rate 4 (-A)", "code": "4,1-0:2.2.4.255" }
          ]
        }
        ,
        {
          name: "Reactive Maximum Demand Register",
          items: [
            { "name": "Maximum Demand Register - Reactive import (+R)", "code": "4,1-0:3.6.0.255" },
            { "name": "Capture time - Maximum Demand Register - Reactive import (+R)", "code": "4,1-0:3.6.0.255" },
            { "name": "Maximum Demand Register - Reactive import (+R) - rate 1", "code": "4,1-0:3.6.1.255" },
            { "name": "Capture time - Maximum Demand Register - Reactive import (+R) - rate 1", "code": "4,1-0:3.6.1.255" },
            { "name": "Maximum Demand Register - Reactive import (+R) - rate 2", "code": "4,1-0:3.6.2.255" },
            { "name": "Capture time - Maximum Demand Register - Reactive import (+R) - rate 2", "code": "4,1-0:3.6.2.255" },
            { "name": "Maximum Demand Register - Reactive import (+R) - rate 3", "code": "4,1-0:3.6.3.255" },
            { "name": "Capture time - Maximum Demand Register - Reactive import (+R) - rate 3", "code": "4,1-0:3.6.3.255" },
            { "name": "Maximum Demand Register - Reactive import (+R) - rate 4", "code": "4,1-0:3.6.4.255" },
            { "name": "Capture time - Maximum Demand Register - Reactive import (+R) - rate 4", "code": "4,1-0:3.6.4.255" },
            { "name": "Maximum Demand Register - Reactive export (-R)", "code": "4,1-0:4.6.0.255" },
            { "name": "Capture time - Maximum Demand Register - Reactive export (-R)", "code": "4,1-0:4.6.0.255" },
            { "name": "Maximum Demand Register - Reactive export (-R) - rate 1", "code": "4,1-0:4.6.1.255" },
            { "name": "Capture time - Maximum Demand Register - Reactive export (-R) - rate 1", "code": "4,1-0:4.6.1.255" },
            { "name": "Maximum Demand Register - Reactive export (-R) - rate 2", "code": "4,1-0:4.6.2.255" },
            { "name": "Capture time - Maximum Demand Register - Reactive export (-R) - rate 2", "code": "4,1-0:4.6.2.255" },
            { "name": "Maximum Demand Register - Reactive export (-R) - rate 3", "code": "4,1-0:4.6.3.255" },
            { "name": "Capture time - Maximum Demand Register - Reactive export (-R) - rate 3", "code": "4,1-0:4.6.3.255" },
            { "name": "Maximum Demand Register - Reactive export (-R) - rate 4", "code": "4,1-0:4.6.4.255" },
            { "name": "Capture time - Maximum Demand Register - Reactive export (-R) - rate 4", "code": "4,1-0:4.6.4.255" }
          ]
        }
        ,
        {
          name: "Apparent Maximum Demand Register",
          items: [
            { "name": "Maximum Demand Register - Apparent import (+VA)", "code": "4,1-0:6.0.255" },
            { "name": "Capture time - Maximum Demand Register - Apparent import (+VA)", "code": "4,1-0:9.6.0.255" },
            { "name": "Maximum Demand Register - Apparent import (+VA) - rate 1", "code": "4,1-0:9.6.1.255" },
            { "name": "Capture time - Maximum Demand Register - Apparent import (+VA) - rate 1", "code": "4,1-0:9.6.1.255" },
            { "name": "Maximum Demand Register - Apparent import (+VA) - rate 2", "code": "4,1-0:9.6.2.255" },
            { "name": "Capture time - Maximum Demand Register - Apparent import (+VA) - rate 2", "code": "4,1-0:9.6.2.255" },
            { "name": "Maximum Demand Register - Apparent import (+VA) - rate 3", "code": "4,1-0:9.6.3.255" },
            { "name": "Capture time - Maximum Demand Register - Apparent import (+VA) - rate 3", "code": "4,1-0:9.6.3.255" },
            { "name": "Maximum Demand Register - Apparent import (+VA) - rate 4", "code": "4,1-0:9.6.4.255" },
            { "name": "Capture time - Maximum Demand Register - Apparent import (+VA) - rate 4", "code": "4,1-0:9.6.4.255" },
            { "name": "Maximum Demand Register - Apparent export (-VA)", "code": "4,1-0:10.6.0.255" },
            { "name": "Capture time - Maximum Demand Register - Apparent export (-VA)", "code": "4,1-0:10.6.0.255" },
            { "name": "Maximum Demand Register - Apparent export (-VA) - rate 1", "code": "4,1-0:10.6.1.255" },
            { "name": "Capture time - Maximum Demand Register - Apparent export (-VA) - rate 1", "code": "4,1-0:10.6.1.255" },
            { "name": "Maximum Demand Register - Apparent export (-VA) - rate 2", "code": "4,1-0:10.6.2.255" },
            { "name": "Capture time - Maximum Demand Register - Apparent export (-VA) - rate 2", "code": "4,1-0:10.6.2.255" },
            { "name": "Maximum Demand Register - Apparent export (-VA) - rate 3", "code": "4,1-0:10.6.3.255" },
            { "name": "Capture time - Maximum Demand Register - Apparent export (-VA) - rate 3", "code": "4,1-0:10.6.3.255" },
            { "name": "Maximum Demand Register - Apparent export (-VA) - rate 4", "code": "4,1-0:10.6.4.255" },
            { "name": "Capture time - Maximum Demand Register - Apparent export (-VA) - rate 4", "code": "4,1-0:10.6.4.255" }
          ]
        },
        
       
  ];
 
  const Dailycategories = [
  {
    name: 'Payment',
    items: [
      { name: 'Residual credit', code: '3, 0-0:19.130.0.255' },
      { name: 'Cumulative purchase credit', code: '3, 1-65:1.140.2.255' },
      { name: 'Increase day consumer credit of current day', code: '3,0-0:19.134.0.255' },
    ],
  },
  {
    name: 'Active Energy Register',
    items: [
      { name: 'Active energy import (+A)', code: '3,1-0:1.8.0.255' },
      { name: 'Active energy import (+A) rate 1', code: '3,1-0:1.8.1.255' },
      { name: 'Active energy import (+A) rate 2', code: '3,1-0:1.8.2.255' },
      { name: 'Active energy import (+A) rate 3', code: '3,1-0:1.8.3.255' },
      { name: 'Active energy import (+A) rate 4', code: '3,1-0:1.8.4.255' },
      { name: 'Active energy export (-A)', code: '3,1-0:2.8.0.255' },
      { name: 'Active energy export (-A) rate 1', code: '3,1-0:2.8.1.255' },
      { name: 'Active energy export (-A) rate 2', code: '3,1-0:2.8.2.255' },
      { name: 'Active energy export (-A) rate 3', code: '3,1-0:2.8.3.255' },
      { name: 'Active energy export (-A) rate 4', code: '3,1-0:2.8.4.255' },
      { name: 'Active energy Combined total ( |+A| + |-A| )', code: '3,1-0:15.8.0.255' },
      { name: 'Active energy Combined total ( |+A| + |-A| ) rate 1', code: '3,1-0:15.8.1.255' },
      { name: 'Active energy Combined total ( |+A| + |-A| ) rate 2', code: '3,1-0:15.8.2.255' },
      { name: 'Active energy Combined total ( |+A| + |-A| ) rate 3', code: '3,1-0:15.8.3.255' },
      { name: 'Active energy Combined total ( |+A| + |-A| ) rate 4', code: '3,1-0:15.8.4.255' },
      { name: 'Active energy Combined total ( |+A| - |-A| )', code: '3,1-0:16.8.0.255' },
      { name: 'Active energy Combined total ( |+A| - |-A| ) rate 1', code: '3,1-0:16.8.1.255' },
      { name: 'Active energy Combined total ( |+A| - |-A| ) rate 2', code: '3,1-0:16.8.2.255' },
      { name: 'Active energy Combined total ( |+A| - |-A| ) rate 3', code: '3,1-0:16.8.3.255' },
      { name: 'Active energy Combined total ( |+A| - |-A| ) rate 4', code: '3,1-0:16.8.4.255' },
    ],
  },
  {
    name: 'Reactive Energy Register',
    items: [
      { name: 'Reactive energy import (+R)', code: '3,1-0:3.8.0.255' },
      { name: 'Reactive energy import (+R) rate 1', code: '3,1-0:3.8.1.255' },
      { name: 'Reactive energy import (+R) rate 2', code: '3,1-0:3.8.2.255' },
      { name: 'Reactive energy import (+R) rate 3', code: '3,1-0:3.8.3.255' },
      { name: 'Reactive energy import (+R) rate 4', code: '3,1-0:3.8.4.255' },
      { name: 'Reactive energy export (-R)', code: '3,1-0:4.8.0.255' },
      { name: 'Reactive energy export (-R) rate 1', code: '3,1-0:4.8.1.255' },
      { name: 'Reactive energy export (-R) rate 2', code: '3,1-0:4.8.2.255' },
      { name: 'Reactive energy export (-R) rate 3', code: '3,1-0:4.8.3.255' },
      { name: 'Reactive energy export (-R) rate 4', code: '3,1-0:4.8.4.255' },
      { name: 'Reactive energy QI (+Ri)', code: '3,1-0:5.8.0.255' },
      { name: 'Reactive energy QI (+Ri) rate 1', code: '3,1-0:5.8.1.255' },
      { name: 'Reactive energy QI (+Ri) rate 2', code: '3,1-0:5.8.2.255' },
      { name: 'Reactive energy QI (+Ri) rate 3', code: '3,1-0:5.8.3.255' },
      { name: 'Reactive energy QI (+Ri) rate 4', code: '3,1-0:5.8.4.255' },
      { name: 'Reactive energy QII (+Rc)', code: '3,1-0:6.8.0.255' },
      { name: 'Reactive energy QII (+Rc) rate 1', code: '3,1-0:6.8.1.255' },
      { name: 'Reactive energy QII (+Rc) rate 2', code: '3,1-0:6.8.2.255' },
      { name: 'Reactive energy QII (+Rc) rate 3', code: '3,1-0:6.8.3.255' },
      { name: 'Reactive energy QII (+Rc) rate 4', code: '3,1-0:6.8.4.255' },
      { name: 'Reactive energy QIII (-Ri)', code: '3,1-0:7.8.0.255' },
      { name: 'Reactive energy QIII (-Ri) rate 1', code: '3,1-0:7.8.1.255' },
      { name: 'Reactive energy QIII (-Ri) rate 2', code: '3,1-0:7.8.2.255' },
      { name: 'Reactive energy QIII (-Ri) rate 3', code: '3,1-0:7.8.3.255' },
      { name: 'Reactive energy QIII (-Ri) rate 4', code: '3,1-0:7.8.4.255' },
      { name: 'Reactive energy QIV (-Rc)', code: '3,1-0:8.8.0.255' },
      { name: 'Reactive energy QIV (-Rc) rate 1', code: '3,1-0:8.8.1.255' },
      { name: 'Reactive energy QIV (-Rc) rate 2', code: '3,1-0:8.8.2.255' },
      { name: 'Reactive energy QIV (-Rc) rate 3', code: '3,1-0:8.8.3.255' },
      { name: 'Reactive energy QIV (-Rc) rate 4', code: '3,1-0:8.8.4.255' },
    ],
  },
  {
    name: 'Apparent Energy Register',
    items: [
      { name: 'Apparent energy import (+VA)', code: '3,1-0:9.8.0.255' },
      { name: 'Apparent energy import (+VA) rate 1', code: '3,1-0:9.8.1.255' },
      { name: 'Apparent energy import (+VA) rate 2', code: '3,1-0:9.8.2.255' },
      { name: 'Apparent energy import (+VA) rate 3', code: '3,1-0:9.8.3.255' },
      { name: 'Apparent energy import (+VA) rate 4', code: '3,1-0:9.8.4.255' },
      { name: 'Apparent energy export (-VA)', code: '3,1-0:10.8.0.255' },
      { name: 'Apparent energy export (-VA) rate 1', code: '3,1-0:10.8.1.255' },
      { name: 'Apparent energy export (-VA) rate 2', code: '3,1-0:10.8.2.255' },
      { name: 'Apparent energy export (-VA) rate 3', code: '3,1-0:10.8.3.255' },
      { name: 'Apparent energy export (-VA) rate 4', code: '3,1-0:10.8.4.255' },
    ],
  },
];







const MonthlyBillingCaptureObjects1 = () => {
  const [selectedItems, setSelectedItems] = useState([]); // items to POST
  const [addedItems, setAddedItems] = useState([]); // items fetched from backend
  const [deviceId, setDeviceId] = useState(() =>
    localStorage.getItem("selectedDeviceId")
  );
  const [selectedRow, setSelectedRow] = useState(null);
  const rowRefs = useRef([]);

 

  const [collapsedCategories, setCollapsedCategories] = useState(() => {
  return new Set((manualCategories || []).map((c) => c.name));
});

  /* -------------------------
     Load device id on mount
  -------------------------- */
  useEffect(() => {
    setDeviceId(localStorage.getItem("selectedDeviceId"));
  }, []);

  /* -------------------------
     GET – fetch monthly billing
  -------------------------- */
  const fetchMonthlyBillingData = async () => {
    if (!deviceId) {
      setAddedItems([]);
      return;
    }
    try {
      const res = await axios.get(`${BASE_URL}/api/monthly-billing/${deviceId}/`);
      setAddedItems(res.data || []);
      setSelectedRow(null);
    } catch (err) {
      console.error("Fetch error:", err);
      setAddedItems([]);
    }
  };

  useEffect(() => {
    fetchMonthlyBillingData();
    // eslint-disable-next-line
  }, [deviceId]);

  /* -------------------------
     Helper: set of saved codes for quick checks
  -------------------------- */
  const savedCodes = useMemo(() => {
    return new Set((addedItems || []).map((it) => it.code));
  }, [addedItems]);

  /* -------------------------
     Single checkbox logic (unchanged)
  -------------------------- */
  const handleCheckboxChange = async (category, name, code, checked) => {
    // If user checks the box
    if (checked) {
      // if already saved, nothing to do
      if (savedCodes.has(code)) {
        // ensure it's not in selectedItems (avoid duplicates)
        setSelectedItems((prev) => prev.filter((s) => !(s.code === code)));
        return;
      }

      // otherwise add to selectedItems if not already present
      setSelectedItems((prev) => {
        const exists = prev.some((p) => p.code === code);
        if (exists) return prev;
        return [...prev, { category, name, code }];
      });
      return;
    }

    // If user unchecks the box
    // If it's a newly-selected item (not yet saved), remove from selectedItems
    if (selectedItems.some((s) => s.code === code)) {
      setSelectedItems((prev) => prev.filter((s) => s.code !== code));
      return;
    }

    // If it was saved in backend, delete it immediately (by id)
    if (savedCodes.has(code)) {
      // find saved item id
      const saved = addedItems.find((it) => it.code === code);
      if (!saved || !saved.id) {
        // fallback: just remove from local saved set
        setAddedItems((prev) => prev.filter((it) => it.code !== code));
        return;
      }

      const ok = window.confirm(`Remove saved item "${saved.name}"?`);
      if (!ok) return;

      try {
        await axios.delete(`${BASE_URL}/api/monthly-billing/item/${saved.id}/`);
        // refresh saved items from server
        await fetchMonthlyBillingData();
      } catch (err) {
        console.error("Failed to delete saved item", err);
        alert("Failed to delete saved item. Try again.");
      }
      return;
    }

    // default: ensure it's removed from selectedItems
    setSelectedItems((prev) => prev.filter((s) => s.code !== code));
  };

  /* -------------------------
     Category-level check/uncheck
     - check = add all non-saved items to selectedItems
     - uncheck = remove newly-selected OR delete saved items (with confirm)
  -------------------------- */
  const handleCategoryToggle = async (categoryObj, checked) => {
    const categoryName = categoryObj.name;
    const items = categoryObj.items || [];

    if (checked) {
      // add all items in this category that are not saved yet
      setSelectedItems((prev) => {
        const prevCodes = new Set(prev.map((p) => p.code));
        const toAdd = items
          .filter((it) => !savedCodes.has(it.code) && !prevCodes.has(it.code))
          .map((it) => ({ category: categoryName, name: it.name, code: it.code }));

        if (!toAdd.length) return prev;
        return [...prev, ...toAdd];
      });
      return;
    }

    // unchecked: remove newly-selected items from this category
    setSelectedItems((prev) => prev.filter((p) => p.category !== categoryName));

    // if there are saved items in this category, confirm and delete them
    const savedInCategory = (addedItems || []).filter((it) => it.category === categoryName);
    if (savedInCategory.length) {
      const ok = window.confirm(
        `This category has ${savedInCategory.length} saved item(s). Unchecking will DELETE them from the server. Proceed?`
      );
      if (!ok) return;

      try {
        // delete all saved items for this category (parallel)
        await Promise.all(
          savedInCategory.map((it) =>
            axios.delete(`${BASE_URL}/api/monthly-billing/item/${it.id}/`)
          )
        );
        await fetchMonthlyBillingData();
      } catch (err) {
        console.error("Failed to delete saved category items", err);
        alert("Failed to delete some saved items. Refresh and try again.");
        await fetchMonthlyBillingData();
      }
    }
  };

  /* -------------------------
     Collapse / Expand a category
  -------------------------- */
  const toggleCollapseCategory = (categoryName) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryName)) next.delete(categoryName);
      else next.add(categoryName);
      return next;
    });
  };

  /* -------------------------
     View category on right table
     - finds first saved item index of that category and selects it (scrolls into view)
  -------------------------- */
  const viewCategoryOnRight = (categoryName) => {
    const idx = (addedItems || []).findIndex((it) => it.category === categoryName);
    if (idx === -1) {
      alert("No saved items for this category to view on the right.");
      return;
    }
    setSelectedRow(idx);
    // scroll handler will do the scroll via effect
  };

  /* -------------------------
     POST – Add items
  -------------------------- */
  const handleAdd = async () => {
    if (!deviceId) return alert("Select a device");
    if (!selectedItems.length) return alert("Select at least one item");

    const payload = selectedItems.map((item) => ({
      device_id: deviceId,
      category: item.category,
      name: item.name,
      code: item.code,
      value: 100,
    }));

    try {
      await axios.post(`${BASE_URL}/api/monthly-billing/`, payload);
      setSelectedItems([]);
      await fetchMonthlyBillingData();
    } catch (err) {
      console.error("Add failed:", err);
      alert("Add failed");
    }
  };

  /* -------------------------
     DELETE – single item (by selected row)
  -------------------------- */
  const handleDelete = async () => {
    if (selectedRow === null) return alert("Select a row");

    const item = addedItems[selectedRow];
    if (!item?.id) return;

    const ok = window.confirm("Delete selected item?");
    if (!ok) return;

    try {
      await axios.delete(`${BASE_URL}/api/monthly-billing/item/${item.id}/`);
      await fetchMonthlyBillingData();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Delete failed");
    }
  };

  /* -------------------------
     DELETE – clean device (all items)
  -------------------------- */
  const handleClear = async () => {
    if (!deviceId) return alert("Select a device");
    const ok = window.confirm("Clear all items for this device?");
    if (!ok) return;

    try {
      await axios.delete(`${BASE_URL}/api/monthly-billing/clean/${deviceId}/`);
      setAddedItems([]);
      setSelectedRow(null);
    } catch (err) {
      console.error("Clear failed:", err);
      alert("Clear failed");
    }
  };

  /* -------------------------
     Navigation helpers
  -------------------------- */
  const handleFirst = () => addedItems.length && setSelectedRow(0);
  const handleLast = () =>
    addedItems.length && setSelectedRow(addedItems.length - 1);
  const handlePrevious = () => selectedRow > 0 && setSelectedRow((p) => p - 1);
  const handleNext = () =>
    selectedRow < addedItems.length - 1 && setSelectedRow((p) => p + 1);

  useEffect(() => {
    if (selectedRow !== null && rowRefs.current[selectedRow]) {
      rowRefs.current[selectedRow].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedRow]);

  /* -------------------------
     UI
  -------------------------- */
  return (
    <div className="display-root" style={{ display: "flex", gap: 12 }}>
      {/* LEFT: categories & checkboxes */}
      <div className="sub_container_display" style={{ flex: 1, overflowY: "auto" }}>
        {(manualCategories || []).map((cat, i) => {
          // determine category-level checkbox state
          const codesInCat = (cat.items || []).map((it) => it.code);
          const allChecked = codesInCat.length > 0 && codesInCat.every((c) => selectedItems.some(s => s.code === c) || savedCodes.has(c));
          const someChecked = codesInCat.some((c) => selectedItems.some(s => s.code === c) || savedCodes.has(c));

          return (
            <div key={i} className="category-block" style={{ marginBottom: 12, border: "1px solid #f0f0f0", padding: 8, borderRadius: 6 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    // tri-state visual: checked if allChecked, otherwise unchecked. (someChecked not visually distinct here — could use indeterminate if desired)
                    checked={allChecked}
                    onChange={(e) => handleCategoryToggle(cat, e.target.checked)}
                  />
                  <strong>{cat.name}</strong>
                </div>

                <div style={{ display: "flex", gap: 6 }}>
                  {/* collapse / expand */}
                  <button
                    onClick={() => toggleCollapseCategory(cat.name)}
                    title={collapsedCategories.has(cat.name) ? "Expand category" : "Collapse category"}
                    style={{ padding: "4px 6px", cursor: "pointer" }}
                  >
                    {collapsedCategories.has(cat.name) ? "▸" : "◂"}
                  </button>

                  {/* view on right */}
                  
                </div>
                
              </div>

              {/* items list (hidden when collapsed) */}
              {!collapsedCategories.has(cat.name) && (
                <div style={{ marginTop: 8 }}>
                  {(cat.items || []).map((item, idx) => {
                    const checked =
                      selectedItems.some((s) => s.code === item.code) ||
                      savedCodes.has(item.code);
                    return (
                      <label key={idx} className="item-label" style={{ display: "block", margin: "6px 0" }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            handleCheckboxChange(
                              cat.name,
                              item.name,
                              item.code,
                              e.target.checked
                            )
                          }
                        />
                        <span style={{ marginLeft: 8 }}>{item.name}</span>
                        <span className="code-text" style={{ marginLeft: 8, color: "#666" }}>
                          ({item.code})
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* CENTER: toolbar */}
      <div className="vertical-toolbar">
        {/* Action buttons */}
        <button className="tool-btn" onClick={handleAdd} title="Add selected to end">
          <span className="tool-icon">+</span>
          <span className="tool-text">Add</span>
        </button>

        <button className="tool-btn" onClick={handleAdd} title="Insert after selected row">
          <span className="tool-icon red-dot"></span>
          <span className="tool-text">Insert</span>
        </button>

        <button className="tool-btn" onClick={handleDelete} title="Delete selected row">
          <span className="tool-icon">−</span>
          <span className="tool-text">Delete</span>
        </button>

        <button className="tool-btn" onClick={handleClear} title="Clear all">
          <span className="tool-icon">×</span>
          <span className="tool-text">Clear</span>
        </button>

        <div className="tool-separator" />

        {/* Navigation buttons */}
        <button className="tool-btn" onClick={handleFirst} title="First">
          <span className="tool-icon">|◀</span>
          <span className="tool-text">First</span>
        </button>

        <button className="tool-btn" onClick={handlePrevious} title="Previous">
          <span className="tool-icon">◀</span>
          <span className="tool-text">Previous</span>
        </button>

        <button className="tool-btn" onClick={handleNext} title="Next">
          <span className="tool-icon">▶</span>
          <span className="tool-text">Next</span>
        </button>

        <button className="tool-btn" onClick={handleLast} title="Last">
          <span className="tool-icon">▶|</span>
          <span className="tool-text">Last</span>
        </button>
      </div>
      
      {/* RIGHT: saved table */}
      <div className="sub_container_display_2" > 
        <div className="display_table"> 
        <table className='tableTariff1' >
          <thead>
            <tr>
              <th  >Name</th>
              <th >Code</th>
             
            </tr>
          </thead>
          <tbody>
            {(addedItems || []).length === 0 ? (
              <tr>
                <td colSpan={3} style={{ padding: 8 }}>No saved items</td>
              </tr>
            ) : (
              (addedItems || []).map((item, idx) => (
                <tr
                  key={item.id || `${item.code}-${idx}`}
                  ref={(el) => (rowRefs.current[idx] = el)}
                  className={selectedRow === idx ? "selected-row" : ""}
                  onClick={() => setSelectedRow(idx)}
                  style={{
                    background: selectedRow === idx ? "#eef" : "transparent",
                    cursor: "pointer",
                  }}
                >
                  <td style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}>{item.name}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}>{item.code}</td>
                 
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};





/**
 * MonthlyBillingCaptureObjects
 * - Category collapse/expand
 * - Category-level select/deselect (auto-selects subitems, prevents duplicates with saved items)
 * - Single checkbox logic (handles saved vs newly-selected items)
 * - Add / Insert / Delete / Clear (left as original behavior)
 * - Navigation (First / Previous / Next / Last) now moves the selected row in the local list
 *   and selection follows the moved row. Navigation buttons are disabled when not applicable.
 *
 * Assumes these globals are available in your project:
 *  - BASE_URL
 *  - manualCategories (array of categories with items)
 *
 * Paste/replace your existing component file with this code.
 */

const MonthlyBillingCaptureObjects = () => {
  const [selectedItems, setSelectedItems] = useState([]); // items to POST (not-yet-saved)
  const [addedItems, setAddedItems] = useState([]); // items fetched from backend (saved items)
  const [deviceId, setDeviceId] = useState(() =>
    localStorage.getItem("selectedDeviceId")
  );
  const [selectedRow, setSelectedRow] = useState(null); // index in addedItems
  const rowRefs = useRef([]);

  // categories collapsed by default (names present => collapsed)
  const [collapsedCategories, setCollapsedCategories] = useState(() =>
    new Set((manualCategories || []).map((c) => c.name))
  );

  /* -------------------------
     Load device id on mount
  -------------------------- */
  useEffect(() => {
    setDeviceId(localStorage.getItem("selectedDeviceId"));
  }, []);

  /* -------------------------
     Fetch saved (monthly billing) items
  -------------------------- */
  const fetchMonthlyBillingData = async () => {
    if (!deviceId) {
      setAddedItems([]);
      setSelectedRow(null);
      return;
    }
    try {
      const res = await axios.get(`${BASE_URL}/api/monthly-billing/${deviceId}/`);
      setAddedItems(res.data || []);
      setSelectedRow(null);
    } catch (err) {
      console.error("Fetch error:", err);
      setAddedItems([]);
      setSelectedRow(null);
    }
  };

  useEffect(() => {
    fetchMonthlyBillingData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]);

  /* -------------------------
     Helper: set of saved codes for quick checks
  -------------------------- */
  const savedCodes = useMemo(() => new Set((addedItems || []).map((it) => it.code)), [addedItems]);

  /* -------------------------
     Single checkbox logic:
     - when checking: if saved skip re-adding, otherwise add to selectedItems (avoid duplicates)
     - when unchecking: remove from selectedItems if new; if saved -> confirm then delete on server
  -------------------------- */
  const handleCheckboxChange = async (category, name, code, checked) => {
    if (checked) {
      // if already saved -> ensure not added to selectedItems (avoid duplicate)
      if (savedCodes.has(code)) {
        setSelectedItems((prev) => prev.filter((s) => s.code !== code));
        return;
      }

      // otherwise add if not already present
      setSelectedItems((prev) => {
        if (prev.some((p) => p.code === code)) return prev;
        return [...prev, { category, name, code }];
      });
      return;
    }

    // unchecked
    // if it's a newly-selected item (not yet saved) -> remove locally
    if (selectedItems.some((s) => s.code === code)) {
      setSelectedItems((prev) => prev.filter((s) => s.code !== code));
      return;
    }

    // if it's saved on server -> ask and delete
    if (savedCodes.has(code)) {
      const saved = addedItems.find((it) => it.code === code);
      if (!saved || !saved.id) {
        // fallback: remove locally
        setAddedItems((prev) => prev.filter((it) => it.code !== code));
        return;
      }

      const ok = window.confirm(`Remove saved item "${saved.name}"?`);
      if (!ok) return;

      try {
        await axios.delete(`${BASE_URL}/api/monthly-billing/item/${saved.id}/`);
        await fetchMonthlyBillingData();
      } catch (err) {
        console.error("Failed to delete saved item", err);
        alert("Failed to delete saved item. Try again.");
      }
      return;
    }

    // fallback: remove from selectedItems
    setSelectedItems((prev) => prev.filter((s) => s.code !== code));
  };

  /* -------------------------
     Category-level toggle:
     - check => add all sub-items that are not saved and not already selected
     - uncheck => remove newly-selected items from this category AND
                 if there are saved items in this category, confirm & delete them
  -------------------------- */
  const handleCategoryToggle = async (categoryObj, checked) => {
    const categoryName = categoryObj.name;
    const items = categoryObj.items || [];

    if (checked) {
      setSelectedItems((prev) => {
        const prevCodes = new Set(prev.map((p) => p.code));
        const toAdd = items
          .filter((it) => !savedCodes.has(it.code) && !prevCodes.has(it.code))
          .map((it) => ({ category: categoryName, name: it.name ?? it.label ?? it.code, code: it.code }));
        if (!toAdd.length) return prev;
        return [...prev, ...toAdd];
      });
      return;
    }

    // unchecked: remove new/seleted items from this category
    setSelectedItems((prev) => prev.filter((p) => p.category !== categoryName));

    // if any saved items in this category -> confirm & delete them on server
    const savedInCategory = (addedItems || []).filter((it) => it.category === categoryName);
    if (savedInCategory.length) {
      const ok = window.confirm(
        `This category has ${savedInCategory.length} saved item(s). Unchecking will DELETE them from the server. Proceed?`
      );
      if (!ok) return;

      try {
        await Promise.all(savedInCategory.map((it) => axios.delete(`${BASE_URL}/api/monthly-billing/item/${it.id}/`)));
        await fetchMonthlyBillingData();
      } catch (err) {
        console.error("Failed to delete saved category items", err);
        alert("Failed to delete some saved items. Refresh and try again.");
        await fetchMonthlyBillingData();
      }
    }
  };

  /* -------------------------
     Collapse / Expand a category
  -------------------------- */
  const toggleCollapseCategory = (categoryName) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryName)) next.delete(categoryName);
      else next.add(categoryName);
      return next;
    });
  };

  /* -------------------------
     View category on right table:
     picks first saved index with same category and selects it (scrolls into view)
  -------------------------- */
  const viewCategoryOnRight = (categoryName) => {
    const idx = (addedItems || []).findIndex((it) => it.category === categoryName);
    if (idx === -1) {
      alert("No saved items for this category to view on the right.");
      return;
    }
    setSelectedRow(idx);
  };

  /* -------------------------
     Add / Insert / Delete / Clear (POST/DELETE endpoints)
  -------------------------- */
  const handleAdd = async () => {
    if (!deviceId) return alert("Select a device");
    if (!selectedItems.length) return alert("Select at least one item");

    const payload = selectedItems.map((item) => ({
      device_id: deviceId,
      category: item.category,
      name: item.name,
      code: item.code,
      value: 100,
    }));

    try {
      await axios.post(`${BASE_URL}/api/monthly-billing/`, payload);
      setSelectedItems([]);
      await fetchMonthlyBillingData();
    } catch (err) {
      console.error("Add failed:", err);
      alert("Add failed");
    }
  };

  const handleInsert = async () => {
    if (!deviceId) return alert("Select a device");
    if (!selectedItems.length) return alert("Select at least one item");

    const insertIndex = selectedRow === null ? (addedItems || []).length : selectedRow + 1;
    const itemsToSend = selectedItems.map((item) => ({
      device_id: deviceId,
      category: item.category,
      name: item.name,
      code: item.code,
      value: 100,
    }));

    try {
      await axios.post(`${BASE_URL}/api/monthly-billing/`, itemsToSend);
      // optimistic local insert for quick feedback
      const newList = [...addedItems];
      const inserted = itemsToSend.map((it) => ({ name: it.name, code: it.code, category: it.category, value: it.value }));
      newList.splice(insertIndex, 0, ...inserted);
      setAddedItems(newList);
      setSelectedRow(insertIndex);
      await fetchMonthlyBillingData();
      setSelectedItems([]);
    } catch (err) {
      console.error("Insert failed:", err);
      alert("Insert failed");
    }
  };

  const handleDelete = async () => {
    if (selectedRow === null) return alert("Select a row");
    const item = addedItems[selectedRow];
    if (!item?.id) return;

    const ok = window.confirm("Delete selected item?");
    if (!ok) return;

    try {
      await axios.delete(`${BASE_URL}/api/monthly-billing/item/${item.id}/`);
      await fetchMonthlyBillingData();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Delete failed");
    }
  };

  const handleClear = async () => {
    if (!deviceId) return alert("Select a device");
    const ok = window.confirm("Clear all items for this device?");
    if (!ok) return;
    try {
      await axios.delete(`${BASE_URL}/api/monthly-billing/clean/${deviceId}/`);
      setAddedItems([]);
      setSelectedRow(null);
    } catch (err) {
      console.error("Clear failed:", err);
      alert("Clear failed");
    }
  };

  /* -------------------------
     moveItem: reorder local array and update selectedRow
     (used by First/Prev/Next/Last so selection follows the moved item)
  -------------------------- */
  const moveItem = (fromIndex, toIndex) => {
    if (fromIndex == null || fromIndex === undefined) return;
    if (!Array.isArray(addedItems) || fromIndex < 0 || fromIndex >= addedItems.length) return;

    setAddedItems((prev) => {
      const next = [...prev];
      const [item] = next.splice(fromIndex, 1);
      // when inserting, clamp between 0 and next.length (append allowed)
      const insertIndex = Math.max(0, Math.min(toIndex, next.length));
      next.splice(insertIndex, 0, item);
      // update selection to item's new index
      // (we set selection after updating state below to ensure it's in sync)
      return next;
    });

    // compute new selection index (note: when moving forward/backward this is fine)
    // We compute relative to current addedItems length.
    const len = addedItems.length;
    const clamped = Math.max(0, Math.min(toIndex, len - 1));
    setSelectedRow(clamped);
  };

  /* -------------------------
     Navigation helpers (reorder rows)
     Buttons will be disabled in UI when not applicable
  -------------------------- */
  const handleFirst = () => {
    if (selectedRow === null) return;
    if (selectedRow === 0) return;
    moveItem(selectedRow, 0);
  };

  const handlePrevious = () => {
    if (selectedRow === null) return;
    if (selectedRow <= 0) return;
    moveItem(selectedRow, selectedRow - 1);
  };

  const handleNext = () => {
    if (selectedRow === null) return;
    const last = (addedItems || []).length - 1;
    if (selectedRow >= last) return;
    moveItem(selectedRow, selectedRow + 1);
  };

  const handleLast = () => {
    if (selectedRow === null) return;
    const last = (addedItems || []).length - 1;
    if (selectedRow === last) return;
    moveItem(selectedRow, last);
  };

  /* -------------------------
     Auto-scroll selected row into view
  -------------------------- */
  useEffect(() => {
    if (selectedRow !== null && rowRefs.current[selectedRow]) {
      rowRefs.current[selectedRow].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedRow]);

  /* -------------------------
     Button state helpers
  -------------------------- */
  const hasSelected = selectedRow !== null;
  const atFirst = hasSelected && selectedRow === 0;
  const atLast = hasSelected && selectedRow === (addedItems || []).length - 1;

  /* -------------------------
     UI
  -------------------------- */
  return (
    <div className="display-root" style={{ display: "flex", gap: 12 }}>
      {/* LEFT: categories & checkboxes */}
      <div className="sub_container_display" style={{ flex: 1, overflowY: "auto" }}>
        {(manualCategories || []).map((cat, i) => {
          const codesInCat = (cat.items || []).map((it) => it.code);
          const allChecked = codesInCat.length > 0 && codesInCat.every((c) => selectedItems.some(s => s.code === c) || savedCodes.has(c));
          const someChecked = codesInCat.some((c) => selectedItems.some(s => s.code === c) || savedCodes.has(c));

          return (
            <div key={i} className="category-block" style={{ marginBottom: 12, border: "1px solid #f0f0f0", padding: 8, borderRadius: 6 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={(e) => handleCategoryToggle(cat, e.target.checked)}
                    // Note: you can set indeterminate programmatically if desired
                  />
                  <strong>{cat.name}</strong>
                </div>

                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => toggleCollapseCategory(cat.name)}
                    title={collapsedCategories.has(cat.name) ? "Expand category" : "Collapse category"}
                    style={{ padding: "4px 6px", cursor: "pointer" }}
                  >
                    {collapsedCategories.has(cat.name) ? "▸" : "◂"}
                  </button>

                 
                </div>
              </div>

              {!collapsedCategories.has(cat.name) && (
                <div style={{ marginTop: 8 }}>
                  {(cat.items || []).map((item, idx) => {
                    const checked = selectedItems.some((s) => s.code === item.code) || savedCodes.has(item.code);
                    return (
                      <label key={idx} className="item-label" style={{ display: "block", margin: "6px 0" }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => handleCheckboxChange(cat.name, item.name, item.code, e.target.checked)}
                        />
                        <span style={{ marginLeft: 8 }}>{item.name}</span>
                        <span className="code-text" style={{ marginLeft: 8, color: "#666" }}>({item.code})</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* CENTER: toolbar */}
      <div className="vertical-toolbar">
        <button className="tool-btn" onClick={handleAdd} title="Add selected to end">
          <span className="tool-icon">+</span>
          <span className="tool-text">Add</span>
        </button>

        <button className="tool-btn" onClick={handleInsert} title="Insert after selected row">
          <span className="tool-icon red-dot"></span>
          <span className="tool-text">Insert</span>
        </button>

        <button className="tool-btn" onClick={handleDelete} title="Delete selected row" disabled={!hasSelected}>
          <span className="tool-icon">−</span>
          <span className="tool-text">Delete</span>
        </button>

        <button className="tool-btn" onClick={handleClear} title="Clear all" disabled={!addedItems.length}>
          <span className="tool-icon">×</span>
          <span className="tool-text">Clear</span>
        </button>

        <div className="tool-separator" style={{ height: 1, background: "#eee", margin: "8px 0" }} />

        {/* Navigation buttons - disabled when not applicable */}
        <button className="tool-btn" onClick={handleFirst} title="First" disabled={!hasSelected || atFirst}>
          <span className="tool-icon">|◀</span>
          <span className="tool-text">First</span>
        </button>

        <button className="tool-btn" onClick={handlePrevious} title="Previous" disabled={!hasSelected || atFirst}>
          <span className="tool-icon">◀</span>
          <span className="tool-text">Previous</span>
        </button>

        <button className="tool-btn" onClick={handleNext} title="Next" disabled={!hasSelected || atLast}>
          <span className="tool-icon">▶</span>
          <span className="tool-text">Next</span>
        </button>

        <button className="tool-btn" onClick={handleLast} title="Last" disabled={!hasSelected || atLast}>
          <span className="tool-icon">▶|</span>
          <span className="tool-text">Last</span>
        </button>
      </div>

      {/* RIGHT: saved table */}
      <div className="sub_container_display_2" style={{ flex: 1, overflowY: "auto" }}>
        <div className="display_table">
          <table className="tableTariff1" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 2 }}>Name</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 2 }}>Code</th>
              </tr>
            </thead>
            <tbody>
              {(addedItems || []).length === 0 ? (
                <tr>
                  <td colSpan={2} style={{ padding: 8 }}>No saved items</td>
                </tr>
              ) : (
                (addedItems || []).map((item, idx) => (
                  <tr
                    key={item.id || `${item.code}-${idx}`}
                    ref={(el) => (rowRefs.current[idx] = el)}
                    className={selectedRow === idx ? "selected-row" : ""}
                    onClick={() => setSelectedRow(idx)}
                    style={{
                      background: selectedRow === idx ? "#eef" : "",
                      cursor: "pointer",
                    }}
                  >
                    <td style={{ padding: 1, borderBottom: "1px solid #f0f0f0" }}>{item.name}</td>
                    <td style={{ padding: 1, borderBottom: "1px solid #f0f0f0" }}>{item.code}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};






const DailyBillingCaptureObjects = () => {
  const [selectedItems, setSelectedItems] = useState([]); // items to POST
  const [addedItems, setAddedItems] = useState([]); // items fetched from backend
  const [deviceId, setDeviceId] = useState(() =>
    localStorage.getItem("selectedDeviceId")
  );
  const [selectedRow, setSelectedRow] = useState(null);
  const rowRefs = useRef([]);

  const [collapsedCategories, setCollapsedCategories] = useState(() => {
    return new Set((Dailycategories || []).map((c) => c.name));
  });

  /* -------------------------
     Load device id on mount
  -------------------------- */
  useEffect(() => {
    setDeviceId(localStorage.getItem("selectedDeviceId"));
  }, []);

  // Button state helpers
const hasSelected = selectedRow !== null;
const atFirst = hasSelected && selectedRow === 0;
const atLast = hasSelected && selectedRow === addedItems.length - 1;

  /* -------------------------
     GET – fetch monthly billing
  -------------------------- */
  const fetchMonthlyBillingData = async () => {
    if (!deviceId) {
      setAddedItems([]);
      return;
    }
    try {
      const res = await axios.get(`${BASE_URL}/api/daily-billing/${deviceId}/`);
      setAddedItems(res.data || []);
      setSelectedRow(null);
    } catch (err) {
      console.error("Fetch error:", err);
      setAddedItems([]);
    }
  };

  useEffect(() => {
    fetchMonthlyBillingData();
    // eslint-disable-next-line
  }, [deviceId]);

  /* -------------------------
     Helper: set of saved codes for quick checks
  -------------------------- */
  const savedCodes = useMemo(() => {
    return new Set((addedItems || []).map((it) => it.code));
  }, [addedItems]);

  /* -------------------------
     Single checkbox logic (unchanged)
  -------------------------- */
  const handleCheckboxChange = async (category, name, code, checked) => {
    // If user checks the box
    if (checked) {
      // if already saved, nothing to do
      if (savedCodes.has(code)) {
        // ensure it's not in selectedItems (avoid duplicates)
        setSelectedItems((prev) => prev.filter((s) => !(s.code === code)));
        return;
      }

      // otherwise add to selectedItems if not already present
      setSelectedItems((prev) => {
        const exists = prev.some((p) => p.code === code);
        if (exists) return prev;
        return [...prev, { category, name, code }];
      });
      return;
    }

    // If user unchecks the box
    // If it's a newly-selected item (not yet saved), remove from selectedItems
    if (selectedItems.some((s) => s.code === code)) {
      setSelectedItems((prev) => prev.filter((s) => s.code !== code));
      return;
    }

    // If it was saved in backend, delete it immediately (by id)
    if (savedCodes.has(code)) {
      // find saved item id
      const saved = addedItems.find((it) => it.code === code);
      if (!saved || !saved.id) {
        // fallback: just remove from local saved set
        setAddedItems((prev) => prev.filter((it) => it.code !== code));
        return;
      }

      const ok = window.confirm(`Remove saved item "${saved.name}"?`);
      if (!ok) return;

      try {
        await axios.delete(`${BASE_URL}/api/daily-billing/item/${saved.id}/`);
        // refresh saved items from server
        await fetchMonthlyBillingData();
      } catch (err) {
        console.error("Failed to delete saved item", err);
        alert("Failed to delete saved item. Try again.");
      }
      return;
    }

    // default: ensure it's removed from selectedItems
    setSelectedItems((prev) => prev.filter((s) => s.code !== code));
  };

  /* -------------------------
     Category-level check/uncheck
  -------------------------- */
  const handleCategoryToggle = async (categoryObj, checked) => {
    const categoryName = categoryObj.name;
    const items = categoryObj.items || [];

    if (checked) {
      // add all items in this category that are not saved yet
      setSelectedItems((prev) => {
        const prevCodes = new Set(prev.map((p) => p.code));
        const toAdd = items
          .filter((it) => !savedCodes.has(it.code) && !prevCodes.has(it.code))
          .map((it) => ({ category: categoryName, name: it.name, code: it.code }));

        if (!toAdd.length) return prev;
        return [...prev, ...toAdd];
      });
      return;
    }

    // unchecked: remove newly-selected items from this category
    setSelectedItems((prev) => prev.filter((p) => p.category !== categoryName));

    // if there are saved items in this category, confirm and delete them
    const savedInCategory = (addedItems || []).filter((it) => it.category === categoryName);
    if (savedInCategory.length) {
      const ok = window.confirm(
        `This category has ${savedInCategory.length} saved item(s). Unchecking will DELETE them from the server. Proceed?`
      );
      if (!ok) return;

      try {
        // delete all saved items for this category (parallel)
        await Promise.all(
          savedInCategory.map((it) =>
            axios.delete(`${BASE_URL}/api/daily-billing/item/${it.id}/`)
          )
        );
        await fetchMonthlyBillingData();
      } catch (err) {
        console.error("Failed to delete saved category items", err);
        alert("Failed to delete some saved items. Refresh and try again.");
        await fetchMonthlyBillingData();
      }
    }
  };

  /* -------------------------
     Collapse / Expand a category
  -------------------------- */
  const toggleCollapseCategory = (categoryName) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryName)) next.delete(categoryName);
      else next.add(categoryName);
      return next;
    });
  };

  /* -------------------------
     View category on right table
  -------------------------- */
  const viewCategoryOnRight = (categoryName) => {
    const idx = (addedItems || []).findIndex((it) => it.category === categoryName);
    if (idx === -1) {
      alert("No saved items for this category to view on the right.");
      return;
    }
    setSelectedRow(idx);
  };

  /* -------------------------
     POST – Add items
  -------------------------- */
  const handleAdd = async () => {
    if (!deviceId) return alert("Select a device");
    if (!selectedItems.length) return alert("Select at least one item");

    const payload = selectedItems.map((item) => ({
      device_id: deviceId,
      category: item.category,
      name: item.name,
      code: item.code,
      value: 100,
    }));

    try {
      await axios.post(`${BASE_URL}/api/daily-billing/`, payload);
      setSelectedItems([]);
      await fetchMonthlyBillingData();
    } catch (err) {
      console.error("Add failed:", err);
      alert("Add failed");
    }
  };

  /* -------------------------
     DELETE – single item (by selected row)
  -------------------------- */
  const handleDelete = async () => {
    if (selectedRow === null) return alert("Select a row");

    const item = addedItems[selectedRow];
    if (!item?.id) return;

    const ok = window.confirm("Delete selected item?");
    if (!ok) return;

    try {
      await axios.delete(`${BASE_URL}/api/daily-billing/item/${item.id}/`);
      await fetchMonthlyBillingData();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Delete failed");
    }
  };

  /* -------------------------
     DELETE – clean device (all items)
  -------------------------- */
  const handleClear = async () => {
    if (!deviceId) return alert("Select a device");
    const ok = window.confirm("Clear all items for this device?");
    if (!ok) return;

    try {
      await axios.delete(`${BASE_URL}/api/daily-billing/clean/${deviceId}/`);
      setAddedItems([]);
      setSelectedRow(null);
    } catch (err) {
      console.error("Clear failed:", err);
      alert("Clear failed");
    }
  };

  /* -------------------------
     moveItem: reorder local array and update selectedRow
     (improved: used by First/Prev/Next/Last)
  -------------------------- */
  const moveItem = (fromIndex, toIndex) => {
    if (fromIndex === null || fromIndex === undefined) return;
    if (!Array.isArray(addedItems) || fromIndex < 0 || fromIndex >= addedItems.length) return;

    // compute target and clamp
    const len = addedItems.length;
    let insertIndex = Math.max(0, Math.min(toIndex, len - 1));

    // create new array with moved item
    const next = [...addedItems];
    const [item] = next.splice(fromIndex, 1);
    // if moving forward to end, when we've removed the item the length decreased by 1,
    // so allow inserting at next.length (append)
    const finalInsert = insertIndex > next.length ? next.length : insertIndex;
    next.splice(finalInsert, 0, item);

    setAddedItems(next);
    // set selectedRow to the item's new index
    setSelectedRow(finalInsert);
  };

  // Navigation helpers that now reorder rows
  const handleFirst = () => {
    if (selectedRow === null) {
      alert("Select a row");
      return;
    }
    if (selectedRow === 0) return; // already first
    moveItem(selectedRow, 0);
  };

  const handlePrevious = () => {
    if (selectedRow === null) {
      alert("Select a row");
      return;
    }
    if (selectedRow <= 0) return;
    moveItem(selectedRow, selectedRow - 1);
  };

  const handleNext = () => {
    if (selectedRow === null) {
      alert("Select a row");
      return;
    }
    const lastIndex = (addedItems || []).length - 1;
    if (selectedRow >= lastIndex) return;
    moveItem(selectedRow, selectedRow + 1);
  };

  const handleLast = () => {
    if (selectedRow === null) {
      alert("Select a row");
      return;
    }
    const lastIndex = (addedItems || []).length - 1;
    if (selectedRow === lastIndex) return;
    moveItem(selectedRow, lastIndex);
  };

  /* -------------------------
     Keep row in view when selection changes
  -------------------------- */
  useEffect(() => {
    if (selectedRow !== null && rowRefs.current[selectedRow]) {
      rowRefs.current[selectedRow].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedRow]);

  /* -------------------------
     UI
  -------------------------- */
  return (
    <div className="display-root" style={{ display: "flex", gap: 12 }}>
      {/* LEFT: categories & checkboxes */}
      <div className="sub_container_display" style={{ flex: 1, overflowY: "auto" }}>
        {(Dailycategories || []).map((cat, i) => {
          // determine category-level checkbox state
          const codesInCat = (cat.items || []).map((it) => it.code);
          const allChecked = codesInCat.length > 0 && codesInCat.every((c) => selectedItems.some(s => s.code === c) || savedCodes.has(c));
          const someChecked = codesInCat.some((c) => selectedItems.some(s => s.code === c) || savedCodes.has(c));

          return (
            <div key={i} className="category-block" style={{ marginBottom: 12, border: "1px solid #f0f0f0", padding: 8, borderRadius: 6 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={(e) => handleCategoryToggle(cat, e.target.checked)}
                  />
                  <strong>{cat.name}</strong>
                </div>

                <div style={{ display: "flex", gap: 6 }}>
                  {/* collapse / expand */}
                  <button
                    onClick={() => toggleCollapseCategory(cat.name)}
                    title={collapsedCategories.has(cat.name) ? "Expand category" : "Collapse category"}
                    style={{ padding: "4px 6px", cursor: "pointer" }}
                  >
                    {collapsedCategories.has(cat.name) ? "▸" : "◂"}
                  </button>
                </div>
              </div>

              {!collapsedCategories.has(cat.name) && (
                <div style={{ marginTop: 8 }}>
                  {(cat.items || []).map((item, idx) => {
                    const checked =
                      selectedItems.some((s) => s.code === item.code) ||
                      savedCodes.has(item.code);
                    return (
                      <label key={idx} className="item-label" style={{ display: "block", margin: "6px 0" }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            handleCheckboxChange(
                              cat.name,
                              item.name,
                              item.code,
                              e.target.checked
                            )
                          }
                        />
                        <span style={{ marginLeft: 8 }}>{item.name}</span>
                        <span className="code-text" style={{ marginLeft: 8, color: "#666" }}>
                          ({item.code})
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* CENTER: toolbar */}
      <div className="vertical-toolbar">
        {/* Action buttons */}
        <button className="tool-btn" onClick={handleAdd} title="Add selected to end">
          <span className="tool-icon">+</span>
          <span className="tool-text">Add</span>
        </button>

        <button className="tool-btn" onClick={handleAdd} title="Insert after selected row">
          <span className="tool-icon red-dot"></span>
          <span className="tool-text">Insert</span>
        </button>

        <button className="tool-btn" onClick={handleDelete} title="Delete selected row">
          <span className="tool-icon">−</span>
          <span className="tool-text">Delete</span>
        </button>

        <button className="tool-btn" onClick={handleClear} title="Clear all">
          <span className="tool-icon">×</span>
          <span className="tool-text">Clear</span>
        </button>

        <div className="tool-separator" />

        {/* Navigation buttons */}
        {/* Navigation buttons */}
<button
  className="tool-btn"
  onClick={handleFirst}
  title="First"
  disabled={!hasSelected || atFirst}
>
  <span className="tool-icon">|◀</span>
  <span className="tool-text">First</span>
</button>

<button
  className="tool-btn"
  onClick={handlePrevious}
  title="Previous"
  disabled={!hasSelected || atFirst}
>
  <span className="tool-icon">◀</span>
  <span className="tool-text">Previous</span>
</button>

<button
  className="tool-btn"
  onClick={handleNext}
  title="Next"
  disabled={!hasSelected || atLast}
>
  <span className="tool-icon">▶</span>
  <span className="tool-text">Next</span>
</button>

<button
  className="tool-btn"
  onClick={handleLast}
  title="Last"
  disabled={!hasSelected || atLast}
>
  <span className="tool-icon">▶|</span>
  <span className="tool-text">Last</span>
</button>
      </div>

      {/* RIGHT: saved table */}
      <div className="sub_container_display_2" >
        <div className="display_table">
          <table className='tableTariff1'>
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 1 }}>Name</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 1 }}>Code</th>
              </tr>
            </thead>
            <tbody>
              {(addedItems || []).length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: 1 }}>No saved items</td>
                </tr>
              ) : (
                (addedItems || []).map((item, idx) => (
                  <tr
                    key={item.id || `${item.code}-${idx}`}
                    ref={(el) => (rowRefs.current[idx] = el)}
                    className={selectedRow === idx ? "selected-row" : ""}
                    onClick={() => setSelectedRow(idx)}
                    style={{
                      background: selectedRow === idx ? "#eef" : "",
                      cursor: "pointer",
                    }}
                  >
                    <td style={{ padding: 1, borderBottom: "1px solid #f0f0f0" }}>{item.name}</td>
                    <td style={{ padding: 1, borderBottom: "1px solid #f0f0f0" }}>{item.code}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};



const Billing = () => {
  const [activePage, setActivePage] = useState('demand');
  

  const handleButtonClick = (page) => {
    setActivePage(page);
  };

 

  
    const [checkboxData, setCheckboxData] = useState([
      { device_id: 1, name: "Sub-interval time for max", code: "{ 5,1-0:1.4.0.255 }", attribute: 8, checked: false },
      { device_id: 1, name: "Sub-interval number for max", code: "{ 5,1-0:1.4.0.255 }", attribute: 9, checked: false }
    ]);

   const [deviceId, setDeviceId] = useState(() => localStorage.getItem('selectedDeviceId'));
      
       useEffect(() => {
         const storedId = localStorage.getItem('selectedDeviceId');
         setDeviceId(storedId);
       }, []);
 

 
  






  // Handle checkbox change
  const handleChangeDemandConfigure = (index) => {
    const newData = [...checkboxData];
    newData[index].checked = !newData[index].checked;
    setCheckboxData(newData);
  };

  // Handle save and send data using axios
  const handleSave = () => {

    console.log(checkboxData)
    
    
    axios.post(`${BASE_URL}/api/demand-configure/`, checkboxData)
      .then((response) => {
        console.log("Data saved successfully", response);
      })
      .catch((error) => {
        console.error("Error saving data", error);
      });
  };




  
  


  


  const renderContent = () => {
    switch (activePage) {
      case 'demand':
      return (
          <div>
      
        <table className='tableTariff1'>
          <thead>
            <tr>
              <th>Checked</th>
              <th>No</th>
              <th>Name</th>
              <th>Code</th>
              <th>Attribute</th>
            </tr>
          </thead>
          <tbody>
            {checkboxData.map((item, index) => (
              <tr key={index}>
                <td>
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => handleChangeDemandConfigure(index)}
                  />
                </td>
                <td>{item.device_id}</td>
                <td>{item.name}</td>
                <td>{item.code}</td>
                <td>{item.attribute}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button style={{marginLeft:"40%"}} className="scheduler-add-button" onClick={handleSave}>Save</button>
      </div>
      )
      
      case 'monthly':
        return (
         

           <MonthlyBillingCaptureObjects/>
          
        );
      case 'daily':
        return (
          <>
          <DailyBillingCaptureObjects/>
          
          </>
        );
      default:
        return <p>Please select an option.</p>;
    }
  };


  
  return (
    <div>
      
     <div
  className="view-toggle"
  role="tablist"
  aria-label="Billing configuration selection"
>
  <button
    type="button"
    role="tab"
    aria-pressed={activePage === "demand"}
    className={`view-btn ${
      activePage === "demand" ? "active" : ""
    }`}
    onClick={() => {
      setActivePage("demand");
      handleButtonClick("demand");
    }}
  >
    Demand Configure
  </button>

  <button
    type="button"
    role="tab"
    aria-pressed={activePage === "monthly"}
    className={`view-btn ${
      activePage === "monthly" ? "active" : ""
    }`}
    onClick={() => {
      setActivePage("monthly");
      handleButtonClick("monthly");
    }}
  >
    Capture Object of Monthly Billing
  </button>

  <button
    type="button"
    role="tab"
    aria-pressed={activePage === "daily"}
    className={`view-btn ${
      activePage === "daily" ? "active" : ""
    }`}
    onClick={() => {
      setActivePage("daily");
      handleButtonClick("daily");
    }}
  >
    Capture Object of Daily Billing
  </button>
</div>


      
      <div className='load-control-container'>{renderContent()}</div>

    
      
    </div>
  );
};

export default Billing;
