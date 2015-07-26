<?php
// src/Acme/MainBundle/Menu/MenuBuilder.php

namespace Pouce\SiteBundle\Menu;

use Knp\Menu\FactoryInterface;
use Symfony\Component\DependencyInjection\ContainerAware;

class MenuBuilder extends ContainerAware
{
    public function mainMenu(FactoryInterface $factory, array $options)
    {
        $menu = $factory->createItem('root');
        $menu->setChildrenAttribute('class', 'right hide-on-med-and-down');
        $menu->addChild('Le Pouce d\'Or')->setAttribute('dropdown', true)->setLinkAttribute('data-activates', 'dropdown1')->setChildrenAttribute('id', 'dropdown1');
        $menu['Le Pouce d\'Or']->addChild('L\'association', array('route' => 'pouce_site_asso'));
        $menu['Le Pouce d\'Or']->addChild('Règles', array('route' => 'pouce_site_regles'));
        $menu['Le Pouce d\'Or']->addChild('Conseils et recommandations', array('route' => 'pouce_site_conseils'));
        $menu['Le Pouce d\'Or']->addChild('Liens', array('route' => 'pouce_site_liens'));
        $menu->addChild('Edition 2015')->setAttribute('dropdown', true)->setLinkAttribute('data-activates', 'dropdown2')->setChildrenAttribute('id', 'dropdown2');
        $menu['Edition 2015']->addChild('S\'incrire', array('uri' => '#'));
        $menu['Edition 2015']->addChild('Inscrire son école', array('uri' => '#'));
        $menu['Edition 2015']->addChild('Listes des inscrits', array('uri' => '#'));
        $menu['Edition 2015']->addChild('Edition 2015', array('route' => 'pouce_site_edition'));
        $menu->addChild('Archives', array('route' => 'pouce_site_archives'));
        $menu->addChild('Top 25', array('route' => 'pouce_site_records'));

        return $menu;
    }

    public function mobileMenu(FactoryInterface $factory, array $options)
    {
        $menu = $factory->createItem('root');
        $menu->setChildrenAttribute('id', 'nav-mobile');
        $menu->setChildrenAttribute('class', 'side-nav');
        $menu->addChild('L\'association', array('route' => 'pouce_site_asso'));
        $menu->addChild('Règles', array('route' => 'pouce_site_regles'));
        $menu->addChild('Conseils et recommandations', array('route' => 'pouce_site_conseils'));
        $menu->addChild('Liens', array('route' => 'pouce_site_liens'));
        $menu->addChild('S\'incrire', array('uri' => '#'));
        $menu->addChild('Inscrire son école', array('uri' => '#'));
        $menu->addChild('Listes des inscrits', array('uri' => '#'));
        $menu->addChild('Edition 2015', array('route' => 'pouce_site_edition'));
        $menu->addChild('Archives', array('route' => 'pouce_site_archives'));
        $menu->addChild('Top 25', array('route' => 'pouce_site_records'));

        return $menu;
    }
}