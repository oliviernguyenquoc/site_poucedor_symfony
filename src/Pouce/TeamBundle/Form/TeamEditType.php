<?php

namespace Pouce\TeamBundle\Form;

use Symfony\Component\Form\FormBuilderInterface;

class TeamEditType extends TeamType
{

    /**
     * @param FormBuilderInterface $builder
     * @param array $options
     */
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        // On fait appel à la méthode buildForm du parent, qui va ajouter tous les champs à $builder
        parent::buildForm($builder, $options);
     
        // On supprime celui qu'on ne veut pas dans le formulaire de modification
        $builder->remove('users');
    }

    /**
     * @return string
     */
    public function getName()
    {
        return 'pouce_teambundle_teamEdit';
    }
}
