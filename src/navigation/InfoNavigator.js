import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AboutScreen from '../screens/info/AboutScreen';
import ContactScreen from '../screens/info/ContactScreen';
import CareersScreen from '../screens/info/CareersScreen';
import PartnerScreen from '../screens/info/PartnerScreen';
import HelpCenterScreen from '../screens/info/HelpCenterScreen';
import HelpCenterTabsScreen from '../screens/info/HelpCenterTabsScreen';
import ShippingInfoScreen from '../screens/info/ShippingInfoScreen';
import ProductCareScreen from '../screens/info/ProductCareScreen';
import PrivacyPolicyScreen from '../screens/info/PrivacyPolicyScreen';
import TermsScreen from '../screens/info/TermsScreen';
import ReturnRefundPolicyScreen from '../screens/info/ReturnRefundPolicyScreen';
import SitemapScreen from '../screens/info/SitemapScreen';
import NotFoundScreen from '../screens/NotFoundScreen';
import { defaultHeaderOptions } from './headerConfig';

const Stack = createNativeStackNavigator();

const InfoNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={defaultHeaderOptions}
    >
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Contact" component={ContactScreen} />
      <Stack.Screen name="Careers" component={CareersScreen} />
      <Stack.Screen name="Partner" component={PartnerScreen} />
      <Stack.Screen 
        name="HelpCenter" 
        component={HelpCenterScreen}
        options={{
          title: 'Help Center',
        }}
      />
      <Stack.Screen 
        name="HelpCenterTabs" 
        component={HelpCenterTabsScreen}
        options={{
          title: 'FAQs',
        }}
      />
      <Stack.Screen name="ShippingInfo" component={ShippingInfoScreen} />
      <Stack.Screen name="ProductCare" component={ProductCareScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} />
      <Stack.Screen name="ReturnRefundPolicy" component={ReturnRefundPolicyScreen} />
      <Stack.Screen name="Sitemap" component={SitemapScreen} />
      <Stack.Screen name="NotFound" component={NotFoundScreen} />
    </Stack.Navigator>
  );
};

export default InfoNavigator;
